const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();

const db = getFirestore();
const messaging = getMessaging();

/**
 * Send FCM push when a new chat message is created.
 */
exports.onChatMessageCreated = onDocumentCreated(
  'conversations/{conversationId}/messages/{messageId}',
  async (event) => {
    const messageData = event.data?.data();
    const conversationId = event.params.conversationId;
    const messageId = event.params.messageId;

    if (!messageData) {
      console.warn('onChatMessageCreated: no message data', { conversationId, messageId });
      return;
    }

    const senderId = messageData.senderId;
    if (!senderId || senderId === 'moto_ai') {
      return;
    }

    const conversationSnap = await db.collection('conversations').doc(conversationId).get();
    if (!conversationSnap.exists) {
      console.warn('onChatMessageCreated: conversation not found', conversationId);
      return;
    }

    const conversation = conversationSnap.data();
    const participants = conversation?.participants || [];
    const recipientId = participants.find((p) => p !== senderId);

    if (!recipientId) {
      console.warn('onChatMessageCreated: no recipient', { conversationId, senderId });
      return;
    }

    const tokensSnap = await db
      .collection('users')
      .doc(recipientId)
      .collection('fcmTokens')
      .get();

    if (tokensSnap.empty) {
      return;
    }

    const tokens = tokensSnap.docs
      .map((doc) => doc.data()?.token)
      .filter((token) => typeof token === 'string' && token.length > 0);

    if (tokens.length === 0) {
      return;
    }

    const text = messageData.text || `[${messageData.messageType || 'message'}]`;
    const senderName =
      conversation?.participantNames?.[senderId] ||
      (conversation?.type === 'dealer' ? 'Dealer' : 'Someone');

    const payload = {
      notification: {
        title: senderName,
        body: text.length > 120 ? `${text.slice(0, 117)}...` : text,
      },
      data: {
        type: 'chat',
        conversationId,
        senderId,
        messageId,
      },
      tokens,
    };

    try {
      const response = await messaging.sendEachForMulticast(payload);

      const invalidTokens = [];
      response.responses.forEach((result, index) => {
        if (!result.success) {
          const code = result.error?.code;
          if (
            code === 'messaging/invalid-registration-token' ||
            code === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(tokensSnap.docs[index].ref);
          }
        }
      });

      if (invalidTokens.length > 0) {
        await Promise.all(invalidTokens.map((ref) => ref.delete()));
      }
    } catch (error) {
      console.error('onChatMessageCreated: FCM send failed', error);
    }
  },
);

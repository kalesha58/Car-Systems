import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import type { Conversation, Message, ConversationType, Presence } from '../types/chat';
import { api } from './api';
import type { IDealersResponse } from '../types/dealer';

function logFirestoreError(fnName: string, collection: string, docPath: string | null, params: any, err: any) {
  console.error(`Firestore Query Failed in ${fnName}:`, {
    collection,
    documentPath: docPath || 'N/A',
    currentFirebaseUid: auth().currentUser?.uid || null,
    queryParameters: params,
    error: err?.message || err,
  });
}

function safeToDate(val: any): Date {
  if (!val) return new Date();
  if (typeof val.toDate === 'function') {
    return val.toDate();
  }
  if (val.seconds !== undefined) {
    return new Date(val.seconds * 1000 + (val.nanoseconds || 0) / 1000000);
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
}

function safeToDateOrUndefined(val: any): Date | undefined {
  if (!val) return undefined;
  if (typeof val.toDate === 'function') {
    return val.toDate();
  }
  if (val.seconds !== undefined) {
    return new Date(val.seconds * 1000 + (val.nanoseconds || 0) / 1000000);
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
}

function normalizeFilePath(uri: string): string {
  if (!uri) return '';
  try {
    return decodeURIComponent(uri);
  } catch (e) {
    return uri;
  }
}

export function sanitizeFirestoreData(data: any): any {
  const sanitize = (val: any): any => {
    if (val === undefined) return null;
    if (val === null) return null;
    if (val instanceof Date) return val;
    if (Array.isArray(val)) {
      return val.map(item => sanitize(item));
    }
    if (typeof val === 'object') {
      if (val.constructor && (val.constructor.name === 'FieldValue' || val.constructor.name === 'rt')) {
        return val;
      }
      const sanitized: Record<string, any> = {};
      Object.entries(val).forEach(([key, v]) => {
        if (v !== undefined) {
          sanitized[key] = sanitize(v);
        }
      });
      return sanitized;
    }
    return val;
  };
  
  const sanitizedData = sanitize(data);
  console.log("Firestore Payload", sanitizedData);
  return sanitizedData;
}

// Collection references
const conversationsCol = () => firestore().collection('conversations');
const presenceCol = () => firestore().collection('presence');
const usersCol = () => firestore().collection('users');
const dealersCol = () => firestore().collection('dealers');

export function buildConversationId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

export async function createConversation(
  participants: string[],
  type: ConversationType,
  details: Partial<Conversation> = {}
): Promise<string> {
  try {
    const unreadCounts: Record<string, number> = {};
    participants.forEach((p) => {
      unreadCounts[p] = 0;
    });

    const payload = sanitizeFirestoreData({
      type,
      participants,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
      unreadCounts,
      pinned: {},
      muted: {},
      archived: {},
      ...details,
    });

    if (type === 'private' || type === 'dealer') {
      const conversationId = buildConversationId(participants[0], participants[1]);
      await conversationsCol().doc(conversationId).set(payload, { merge: true });
      return conversationId;
    }

    const docRef = await conversationsCol().add(payload);
    return docRef.id;
  } catch (err) {
    logFirestoreError('createConversation', 'conversations', 'new document', { participants, type, details }, err);
    throw err;
  }
}

export function listenConversations(
  userId: string,
  onUpdate: (conversations: Conversation[]) => void,
  options?: { blockedUserIds?: string[] },
): () => void {
  let rawConversations: Conversation[] = [];
  const presenceMap = new Map<string, Presence | null>();
  const presenceUnsubs = new Map<string, () => void>();

  const emit = () => {
    const blocked = new Set(options?.blockedUserIds || []);
    const merged = rawConversations
      .filter((conversation) => {
        const otherUserId = conversation.participants.find((p) => p !== userId);
        return !otherUserId || !blocked.has(otherUserId);
      })
      .map((conversation) => {
        const otherUserId = conversation.participants.find((p) => p !== userId) || '';
        const presence = presenceMap.get(otherUserId);
        if (!presence) {
          return conversation;
        }

        return {
          ...conversation,
          isOtherParticipantOnline: presence.online,
          isOtherParticipantTyping: Boolean(presence.typing?.[conversation.id]),
          otherParticipantLastSeen: presence.lastSeen,
        };
      });

    onUpdate(merged);
  };

  const syncPresenceListeners = (conversations: Conversation[]) => {
    const otherIds = new Set(
      conversations
        .map((conversation) => conversation.participants.find((p) => p !== userId))
        .filter((id): id is string => Boolean(id)),
    );

    for (const [otherId, unsub] of presenceUnsubs.entries()) {
      if (!otherIds.has(otherId)) {
        unsub();
        presenceUnsubs.delete(otherId);
        presenceMap.delete(otherId);
      }
    }

    for (const otherId of otherIds) {
      if (presenceUnsubs.has(otherId)) {
        continue;
      }

      const unsub = listenPresence(otherId, (presence) => {
        presenceMap.set(otherId, presence);
        emit();
      });
      presenceUnsubs.set(otherId, unsub);
    }
  };

  const convUnsub = conversationsCol()
    .where('participants', 'array-contains', userId)
    .onSnapshot(
      async (snapshot) => {
        if (!snapshot) return;
        const conversations: Conversation[] = [];

        for (const doc of snapshot.docs) {
          const data = doc.data();
          const conversationId = doc.id;

          const otherUserId = data.participants.find((p: string) => p !== userId) || '';
          let otherParticipantName = data.participantNames?.[otherUserId] || data.name || 'User';
          let otherParticipantAvatar = '';
          let isVerifiedDealer = data.type === 'dealer';

          if (otherUserId) {
            try {
              const userDoc = await usersCol().doc(otherUserId).get();
              if (userDoc.exists) {
                const uData = userDoc.data();
                otherParticipantName = uData?.name || otherParticipantName;
                otherParticipantAvatar = uData?.avatar || '';
              } else {
                const dealerDoc = await dealersCol().doc(otherUserId).get();
                if (dealerDoc.exists) {
                  const dData = dealerDoc.data();
                  otherParticipantName = dData?.name || otherParticipantName;
                  otherParticipantAvatar = dData?.avatar || '';
                  isVerifiedDealer = true;
                }
              }
            } catch (err) {
              logFirestoreError('listenConversations.hydrateUser', 'users/dealers', otherUserId, { otherUserId }, err);
            }
          }

          conversations.push({
            id: conversationId,
            type: data.type,
            participants: data.participants,
            dealerId: data.dealerId,
            name: data.name,
            image: data.image,
            admins: data.admins,
            participantNames: data.participantNames,
            lastMessage: data.lastMessage
              ? {
                  ...data.lastMessage,
                  createdAt: safeToDate(data.lastMessage.createdAt),
                }
              : undefined,
            createdAt: safeToDate(data.createdAt),
            updatedAt: safeToDate(data.updatedAt),
            unreadCounts: data.unreadCounts || {},
            pinned: data.pinned || {},
            muted: data.muted || {},
            archived: data.archived || {},
            otherParticipantName,
            otherParticipantAvatar,
            isVerifiedDealer,
          });
        }

        conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        rawConversations = conversations;
        syncPresenceListeners(rawConversations);
        emit();
      },
      (error) => {
        logFirestoreError('listenConversations.onSnapshot', 'conversations', null, { userId }, error);
      },
    );

  return () => {
    convUnsub();
    presenceUnsubs.forEach((unsub) => unsub());
    presenceUnsubs.clear();
    presenceMap.clear();
  };
}

export function listenMessages(
  conversationId: string,
  onUpdate: (messages: Message[]) => void
): () => void {
  return conversationsCol()
    .doc(conversationId)
    .collection('messages')
    .orderBy('createdAt', 'asc')
    .onSnapshot(
      snapshot => {
        if (!snapshot) return;
        const messages = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            conversationId,
            senderId: data.senderId,
            receiverId: data.receiverId,
            messageType: data.messageType,
            text: data.text,
            image: data.image,
            voice: data.voice,
            pdf: data.pdf,
            location: data.location,
            createdAt: safeToDate(data.createdAt),
            editedAt: safeToDateOrUndefined(data.editedAt),
            status: data.status || 'sent',
            replyTo: data.replyTo,
            attachments: data.attachments,
          } as Message;
        });
        onUpdate(messages);
      },
      error => {
        logFirestoreError('listenMessages', 'messages', `conversations/${conversationId}/messages`, { conversationId }, error);
      }
    );
}

export async function sendMessage(
  conversationId: string,
  messagePayload: Omit<Message, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const timestamp = firestore.FieldValue.serverTimestamp();
    
    // 1. Add message document
    const messageDoc = await conversationsCol()
      .doc(conversationId)
      .collection('messages')
      .add(sanitizeFirestoreData({
        ...messagePayload,
        createdAt: timestamp,
        status: 'sent',
      }));

    // 2. Update lastMessage and unread counts in Conversation
    const updateData: Record<string, any> = {
      updatedAt: timestamp,
      lastMessage: {
        text: messagePayload.text || `[${messagePayload.messageType}]`,
        senderId: messagePayload.senderId,
        createdAt: timestamp,
        messageType: messagePayload.messageType,
      },
    };

    // Increment unread count for other participants
    const convDoc = await conversationsCol().doc(conversationId).get();
    if (convDoc.exists) {
      const data = convDoc.data();
      const currentUnreads = data?.unreadCounts || {};
      const updatedUnreads: Record<string, number> = { ...currentUnreads };

      data?.participants.forEach((p: string) => {
        if (p !== messagePayload.senderId) {
          updatedUnreads[p] = (updatedUnreads[p] || 0) + 1;
        }
      });
      updateData.unreadCounts = updatedUnreads;
    }

    await conversationsCol().doc(conversationId).update(sanitizeFirestoreData(updateData));

    return messageDoc.id;
  } catch (err) {
    logFirestoreError('sendMessage', 'messages', `conversations/${conversationId}/messages`, { conversationId, messagePayload }, err);
    throw err;
  }
}

export async function uploadMedia(conversationId: string, uri: string, pathPrefix: string): Promise<string> {
  const normalized = normalizeFilePath(uri);
  const filename = normalized.substring(normalized.lastIndexOf('/') + 1) || `file_${Date.now()}`;
  const storageRef = storage().ref(`chats/${conversationId}/${pathPrefix}/${filename}`);
  await storageRef.putFile(normalized);
  return await storageRef.getDownloadURL();
}

export async function sendImage(conversationId: string, senderId: string, uri: string): Promise<string> {
  const downloadUrl = await uploadMedia(conversationId, uri, 'images');
  return await sendMessage(conversationId, {
    conversationId,
    senderId,
    messageType: 'image',
    image: downloadUrl,
    status: 'sent',
  });
}

export async function sendVoice(conversationId: string, senderId: string, uri: string): Promise<string> {
  const downloadUrl = await uploadMedia(conversationId, uri, 'voice');
  return await sendMessage(conversationId, {
    conversationId,
    senderId,
    messageType: 'voice',
    voice: downloadUrl,
    status: 'sent',
  });
}

export async function sendDocument(conversationId: string, senderId: string, uri: string, name: string): Promise<string> {
  const downloadUrl = await uploadMedia(conversationId, uri, 'docs');
  return await sendMessage(conversationId, {
    conversationId,
    senderId,
    messageType: 'pdf',
    pdf: downloadUrl,
    status: 'sent',
    attachments: [{ url: downloadUrl, type: 'pdf', name }],
  });
}

export async function createGroup(name: string, members: string[], imageUri?: string): Promise<string> {
  try {
    const unreadCounts: Record<string, number> = {};
    members.forEach(m => {
      unreadCounts[m] = 0;
    });

    let groupImage = imageUri || '';
    if (imageUri && !imageUri.startsWith('http')) {
      const normalized = normalizeFilePath(imageUri);
      const tempId = `group_${Date.now()}`;
      const storageRef = storage().ref(`groups/${tempId}/${tempId}.jpg`);
      await storageRef.putFile(normalized);
      groupImage = await storageRef.getDownloadURL();
    }

    const groupRef = await conversationsCol().add(sanitizeFirestoreData({
      type: 'group',
      participants: members,
      name,
      image: groupImage,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
      unreadCounts,
      pinned: {},
      muted: {},
      archived: {},
      admins: [members[0]], // Creator is default admin
    }));

    return groupRef.id;
  } catch (err) {
    logFirestoreError('createGroup', 'conversations', 'new group document', { name, members, imageUri }, err);
    throw err;
  }
}

export async function leaveGroup(conversationId: string, userId: string): Promise<void> {
  try {
    const convRef = conversationsCol().doc(conversationId);
    const doc = await convRef.get();
    if (doc.exists) {
      const data = doc.data();
      const members = (data?.participants as string[] || []).filter(m => m !== userId);
      const admins = (data?.admins as string[] || []).filter(a => a !== userId);

      if (members.length === 0) {
        await convRef.delete();
      } else {
        const updateData: Record<string, any> = {
          participants: members,
          admins: admins.length === 0 ? [members[0]] : admins, // ensure at least one admin
        };
        // delete unreadCount key
        if (data?.unreadCounts) {
          const uCounts = { ...data.unreadCounts };
          delete uCounts[userId];
          updateData.unreadCounts = uCounts;
        }
        await convRef.update(sanitizeFirestoreData(updateData));
      }
    }
  } catch (err) {
    logFirestoreError('leaveGroup', 'conversations', conversationId, { conversationId, userId }, err);
    throw err;
  }
}

export async function markAsSeen(conversationId: string, userId: string): Promise<void> {
  try {
    // Clear unread counts for this user
    await conversationsCol().doc(conversationId).update(sanitizeFirestoreData({
      [`unreadCounts.${userId}`]: 0,
    }));

    // Mark all un-seen messages in this conversation where user is NOT the sender as 'seen'
    const unreadMessages = await conversationsCol()
      .doc(conversationId)
      .collection('messages')
      .where('senderId', '!=', userId)
      .get();

    const batch = firestore().batch();
    let updated = false;

    unreadMessages.docs.forEach(doc => {
      if (doc.data().status !== 'seen') {
        batch.update(doc.ref, { status: 'seen' });
        updated = true;
      }
    });

    if (updated) {
      await batch.commit();
    }
  } catch (err) {
    logFirestoreError('markAsSeen', 'conversations', conversationId, { conversationId, userId }, err);
    throw err;
  }
}

export async function markAsDelivered(conversationId: string, userId: string): Promise<void> {
  try {
    const undeliveredMessages = await conversationsCol()
      .doc(conversationId)
      .collection('messages')
      .where('senderId', '!=', userId)
      .get();

    const batch = firestore().batch();
    let updated = false;

    undeliveredMessages.docs.forEach(doc => {
      const status = doc.data().status;
      if (status === 'sent') {
        batch.update(doc.ref, { status: 'delivered' });
        updated = true;
      }
    });

    if (updated) {
      await batch.commit();
    }
  } catch (err) {
    logFirestoreError('markAsDelivered', 'conversations', conversationId, { conversationId, userId }, err);
    throw err;
  }
}

export async function updateTypingStatus(
  conversationId: string,
  userId: string,
  isTyping: boolean
): Promise<void> {
  try {
    await presenceCol()
      .doc(userId)
      .set(
        {
          [`typing.${conversationId}`]: isTyping,
        },
        { merge: true },
      );
  } catch (err) {
    logFirestoreError('updateTypingStatus', 'presence', userId, { conversationId, userId, isTyping }, err);
    throw err;
  }
}

export async function updateOnlineStatus(userId: string, online: boolean): Promise<void> {
  try {
    await presenceCol()
      .doc(userId)
      .set(
        sanitizeFirestoreData({
          online,
          lastSeen: firestore.FieldValue.serverTimestamp(),
        }),
        { merge: true }
      );
  } catch (err) {
    logFirestoreError('updateOnlineStatus', 'presence', userId, { userId, online }, err);
    throw err;
  }
}

export async function syncUserProfile(
  userId: string,
  name: string,
  email: string | undefined,
  role: string,
  avatar?: string
): Promise<void> {
  try {
    const collection = role === 'dealer' ? dealersCol() : usersCol();
    const data = {
      name,
      email: email ?? null,
      role,
      avatar: avatar ?? null,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };
    await collection.doc(userId).set(
      sanitizeFirestoreData(data),
      { merge: true }
    );

    await usersCol().doc(userId).set(
      sanitizeFirestoreData(data),
      { merge: true },
    );
  } catch (err) {
    logFirestoreError('syncUserProfile', role === 'dealer' ? 'dealers' : 'users', userId, { userId, name, email, role, avatar }, err);
    throw err;
  }
}

export async function searchUsers(query: string): Promise<any[]> {
  const q = query.trim().toLowerCase();
  
  let apiUsers: any[] = [];
  try {
    const params = q ? { search: query.trim(), limit: 50 } : { limit: 50 };
    const response = await api.get<{
      success: boolean;
      Response?: { users: any[] } | any[];
    }>('/users', { params });

    const data = response.data;
    if (data) {
      let list: any[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data.success && Array.isArray((data as any).users)) {
        list = (data as any).users;
      } else if (data.success && Array.isArray(data.Response)) {
        list = data.Response;
      } else if (data.success && data.Response && Array.isArray((data.Response as any).users)) {
        list = (data.Response as any).users;
      }
      apiUsers = list.map(u => ({
        id: u.id || u._id,
        name: u.name,
        email: u.email,
        avatar: u.avatar || null,
        role: u.role || 'customer',
        matchedPlate: u.matchedPlate || null
      }));
    }
  } catch (err) {
    console.error('API searchUsers failed, trying Firestore:', err);
  }

  try {
    const snapshot = await usersCol().get();
    let firestoreUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    if (q) {
      firestoreUsers = firestoreUsers.filter((user: any) =>
        user.name?.toLowerCase().includes(q) || user.email?.toLowerCase().includes(q)
      );
    }

    const mergedMap = new Map();
    [...apiUsers, ...firestoreUsers].forEach(u => {
      if (u.id) {
        mergedMap.set(u.id, u);
      }
    });
    return Array.from(mergedMap.values());
  } catch (err) {
    console.error('Firestore searchUsers failed:', err);
    return apiUsers;
  }
}

export async function searchDealers(query: string): Promise<any[]> {
  const q = query.trim().toLowerCase();

  let apiDealers: any[] = [];
  try {
    const params = q ? { search: query.trim(), limit: 50 } : { limit: 50 };
    const response = await api.get<IDealersResponse>('/dealers', { params });
    if (response.data && response.data.success && response.data.Response) {
      const dealersList = response.data.Response.dealers || [];
      apiDealers = dealersList.map(d => ({
        id: d.id || d.businessRegistrationId || '',
        name: d.businessName || d.name,
        email: d.email,
        avatar: (d as any).avatar || null,
        role: 'dealer'
      }));
    }
  } catch (err) {
    console.error('API searchDealers failed, trying Firestore:', err);
  }

  try {
    const snapshot = await dealersCol().get();
    let firestoreDealers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    if (q) {
      firestoreDealers = firestoreDealers.filter((dealer: any) =>
        dealer.name?.toLowerCase().includes(q) || dealer.email?.toLowerCase().includes(q)
      );
    }

    const mergedMap = new Map();
    [...apiDealers, ...firestoreDealers].forEach(d => {
      if (d.id) {
        mergedMap.set(d.id, d);
      }
    });
    return Array.from(mergedMap.values());
  } catch (err) {
    console.error('Firestore searchDealers failed:', err);
    return apiDealers;
  }
}

export function listenPresence(userId: string, onUpdate: (presence: Presence | null) => void): () => void {
  return presenceCol()
    .doc(userId)
    .onSnapshot(doc => {
      if (doc.exists) {
        const data = doc.data();
        onUpdate({
          userId: doc.id,
          online: Boolean(data?.online),
          lastSeen: safeToDate(data?.lastSeen),
          typing: data?.typing || {},
        });
      } else {
        onUpdate(null);
      }
    });
}

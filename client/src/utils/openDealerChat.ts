import {createDirectChat} from '@service/chatService';
import {navigate} from '@utils/NavigationUtils';

/**
 * Creates (or opens) a direct chat with the dealer and navigates to ChatMessage.
 *
 * Note: dealerId is treated as the dealer user id.
 */
export async function openDealerChat(dealerId?: string) {
  if (!dealerId) {
    throw new Error('Dealer not available');
  }

  const chat = await createDirectChat({userId: dealerId});
  const chatId = (chat as any)?.id || (chat as any)?._id;
  if (!chatId) {
    throw new Error('Failed to open chat');
  }

  await navigate('ChatMessage', {chatId});
}

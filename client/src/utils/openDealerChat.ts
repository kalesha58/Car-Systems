import {createDirectChat} from '@service/chatService';
import {navigate} from '@utils/NavigationUtils';
import {getDealerInfoByDealerId} from '@service/dealerService';

/**
 * Creates (or opens) a direct chat with the dealer and navigates to ChatMessage.
 *
 * @param dealerId - BusinessRegistration._id (not userId)
 * This function will:
 * 1. Get dealer userId from dealerId
 * 2. Verify dealer is approved
 * 3. Create/get direct chat with dealer's userId
 * 4. Navigate to ChatMessage screen
 */
export async function openDealerChat(dealerId?: string) {
  if (!dealerId) {
    throw new Error('Dealer not available');
  }

  try {
    // Step 1: Get dealer info and verify dealer is approved
    const dealerInfo = await getDealerInfoByDealerId(dealerId);

    // Step 2: Verify dealer status
    if (dealerInfo.status !== 'approved') {
      throw new Error(
        `Dealer account is ${dealerInfo.status}. Please wait for approval.`,
      );
    }

    // Step 3: Create or get direct chat with dealer's userId
    const chat = await createDirectChat({userId: dealerInfo.userId});
    const chatId = (chat as any)?.id || (chat as any)?._id;
    
    if (!chatId) {
      throw new Error('Failed to open chat');
    }

    // Step 4: Navigate to chat screen
    await navigate('ChatMessage', {chatId});
  } catch (error: any) {
    // Re-throw with user-friendly messages
    if (error?.message) {
      throw error;
    }
    throw new Error('Failed to open chat with dealer');
  }
}

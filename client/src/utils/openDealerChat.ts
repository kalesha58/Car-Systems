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
    console.error('openDealerChat: dealerId is missing');
    throw new Error('Dealer not available');
  }

  console.log('openDealerChat: Starting with dealerId:', dealerId);

  try {
    // Step 1: Get dealer info and verify dealer is approved
    console.log('openDealerChat: Fetching dealer info...');
    const dealerInfo = await getDealerInfoByDealerId(dealerId);
    console.log('openDealerChat: Dealer info received:', dealerInfo);

    // Step 2: Verify dealer status
    if (dealerInfo.status !== 'approved') {
      throw new Error(
        `Dealer account is ${dealerInfo.status}. Please wait for approval.`,
      );
    }

    // Step 3: Create or get direct chat with dealer's userId
    console.log('openDealerChat: Creating chat with userId:', dealerInfo.userId);
    const chat = await createDirectChat({userId: dealerInfo.userId});
    const chatId = (chat as any)?.id || (chat as any)?._id;
    
    if (!chatId) {
      throw new Error('Failed to open chat');
    }

    console.log('openDealerChat: Chat created with chatId:', chatId);

    // Step 4: Navigate to chat screen
    await navigate('ChatMessage', {chatId});
  } catch (error: any) {
    console.error('openDealerChat: Error occurred:', {
      dealerId,
      error: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
    });
    
    // Re-throw with user-friendly messages
    if (error?.message) {
      throw error;
    }
    throw new Error('Failed to open chat with dealer');
  }
}

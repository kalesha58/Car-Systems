# Payment Flow - Visual Explanation

This document explains the complete payment flow from frontend to backend using visual diagrams.

---

## 📊 Table of Contents

1. [Overall Payment Flow](#overall-payment-flow)
2. [COD Payment Flow (Detailed)](#cod-payment-flow-detailed)
3. [UPI Payment Flow (Detailed)](#upi-payment-flow-detailed)
4. [Component Interaction Diagram](#component-interaction-diagram)
5. [Data Flow Diagram](#data-flow-diagram)
6. [Webhook Processing Flow](#webhook-processing-flow)
7. [Payment Status Polling Flow](#payment-status-polling-flow)

---

## 🎯 Overall Payment Flow

```mermaid
graph TB
    Start([User on Cart Screen]) --> Select{Select Payment Method}
    
    Select -->|COD| CODPath[COD Payment Path]
    Select -->|UPI| UPIPath[UPI Payment Path]
    
    CODPath --> CODResult([Order Created - PENDING_COD])
    
    UPIPath --> UPICreate[Create Payment Intent]
    UPICreate --> UPIApp[Open UPI App]
    UPIApp --> UPIPoll[Poll Payment Status]
    UPIPoll --> Webhook[Razorpay Webhook]
    Webhook --> UPISuccess([Payment Confirmed])
    
    style Start fill:#e1f5ff
    style CODResult fill:#c8e6c9
    style UPISuccess fill:#c8e6c9
    style Webhook fill:#fff9c4
```

---

## 💵 COD Payment Flow (Detailed)

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Frontend<br/>(Cart Screen)
    participant Backend as Backend API<br/>(Order Controller)
    participant OrderService as Order Service
    participant PaymentService as Payment Service
    participant Database as MongoDB

    User->>Frontend: Selects "Cash on Delivery"
    User->>Frontend: Clicks "Place Order"
    
    Frontend->>Frontend: Generate Idempotency Key
    Frontend->>Backend: POST /api/user/orders<br/>{paymentMethod: "cash_on_delivery", items, address}
    
    Backend->>OrderService: createUserOrder(userId, orderData)
    
    OrderService->>OrderService: Calculate: subtotal + tax + shipping
    OrderService->>Database: Create Order Document<br/>(status: ORDER_PLACED)
    
    OrderService->>PaymentService: processCODOrder(orderId)
    
    PaymentService->>PaymentService: Add ₹5 COD charge
    PaymentService->>PaymentService: Update order.totalAmount
    PaymentService->>PaymentService: Set status: PENDING_COD
    PaymentService->>PaymentService: Set paymentStatus: pending
    PaymentService->>Database: Save Order
    
    PaymentService-->>OrderService: Return updated order
    OrderService-->>Backend: Return order object
    Backend-->>Frontend: 201 Created<br/>{success: true, data: order}
    
    Frontend->>Frontend: Clear cart
    Frontend->>User: Navigate to Order Success Screen
    
    Note over Database: Order Status: PENDING_COD<br/>Waiting for COD collection
    
    Note over User,Database: Later: Dealer/Admin marks COD collected<br/>Order → PAYMENT_CONFIRMED
```

### COD Flow Steps:

1. **User Action**: Selects COD and places order
2. **Frontend**: Sends order request with idempotency key
3. **Backend**: Creates order, calculates total
4. **Payment Service**: Adds ₹5 COD charge, sets status to PENDING_COD
5. **Response**: Order confirmation returned
6. **Frontend**: Shows success screen
7. **Later**: Manual COD collection by dealer/admin

---

## 💳 UPI Payment Flow (Detailed)

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Frontend<br/>(Cart Screen)
    participant PaymentScreen as Payment Status<br/>Screen
    participant Backend as Backend API
    participant OrderService as Order Service
    participant PaymentService as Payment Service
    participant Razorpay as Razorpay Gateway
    participant UPIApp as UPI App<br/>(PhonePe/GPay)
    participant Webhook as Webhook Handler
    participant Database as MongoDB

    User->>Frontend: Selects "Pay Now (UPI)"
    User->>Frontend: Clicks "Place Order"
    
    Frontend->>Frontend: Generate Idempotency Key
    Frontend->>Backend: POST /api/user/orders<br/>{paymentMethod: "upi", items, address, dealerId}
    
    Backend->>OrderService: createUserOrder(userId, orderData)
    OrderService->>Database: Create Order<br/>(status: ORDER_PLACED)
    
    OrderService->>PaymentService: processUPIPayment(orderId, dealerId)
    
    PaymentService->>PaymentService: Validate dealer payout credentials
    PaymentService->>PaymentService: Calculate amount in paise
    PaymentService->>Razorpay: createPaymentIntent({amount, currency, orderId})
    
    Razorpay-->>PaymentService: Return paymentIntent<br/>{id, amount, status}
    
    PaymentService->>PaymentService: Store paymentIntentId in order
    PaymentService->>PaymentService: Set status: PENDING_PAYMENT
    PaymentService->>PaymentService: Set expiresAt: now + 15 min
    PaymentService->>Database: Save Order + Payment Record
    
    PaymentService-->>OrderService: Return {order, paymentIntent}
    OrderService-->>Backend: Return order + paymentAction
    Backend-->>Frontend: 201 Created<br/>{data: {order, paymentAction}}
    
    Frontend->>PaymentScreen: Navigate with paymentAction
    PaymentScreen->>PaymentScreen: initiateUPIPayment(paymentAction)
    PaymentScreen->>UPIApp: Open deep link<br/>(razorpay://pay?...)
    
    UPIApp->>User: Show payment screen
    User->>UPIApp: Enter UPI PIN & Confirm
    
    PaymentScreen->>PaymentScreen: Start polling<br/>pollPaymentStatus(orderId)
    
    loop Every 3 seconds (with backoff)
        PaymentScreen->>Backend: GET /api/user/orders/{id}/status
        Backend->>Database: Query order status
        Database-->>Backend: Return order status
        Backend-->>PaymentScreen: {status, paymentStatus}
    end
    
    UPIApp->>Razorpay: Process payment
    Razorpay->>Razorpay: Verify & capture payment
    Razorpay->>Webhook: POST /api/webhooks/razorpay<br/>{event: "payment.captured", payment: {...}}
    
    Webhook->>Webhook: Verify signature
    Webhook->>Database: Store webhook event
    Webhook->>Razorpay: Get payment details
    Webhook->>Database: Find order by paymentIntentId
    Webhook->>Database: Update order:<br/>status: PAYMENT_CONFIRMED<br/>paymentStatus: paid
    Webhook->>Database: Update payment record
    Webhook->>PaymentService: initiateDealerPayout(orderId)
    Webhook->>Database: Create payout record
    
    Note over PaymentScreen: Polling detects paymentStatus: 'paid'
    PaymentScreen->>PaymentScreen: Show "Payment Successful"
    PaymentScreen->>Frontend: Navigate to Order Success
```

### UPI Flow Steps:

1. **Order Creation**: User places order with UPI method
2. **Payment Intent**: Backend creates Razorpay payment intent
3. **UPI App**: Frontend opens UPI app via deep link
4. **User Payment**: User completes payment in UPI app
5. **Polling**: Frontend polls order status every 3 seconds
6. **Webhook**: Razorpay sends webhook when payment succeeds
7. **Status Update**: Backend updates order to PAYMENT_CONFIRMED
8. **Frontend Update**: Polling detects change, shows success
9. **Payout**: Backend initiates payout to dealer

---

## 🔄 Component Interaction Diagram

```mermaid
graph LR
    subgraph "Frontend (React Native)"
        A[Cart Screen]
        B[Payment Status Screen]
        C[Order Success Screen]
        D[UPI Payment Service]
        E[Order Service API]
    end
    
    subgraph "Backend API"
        F[Order Controller]
        G[Order Service]
        H[Payment Service]
        I[Gateway Service]
        J[Webhook Controller]
    end
    
    subgraph "External Services"
        K[Razorpay Gateway]
        L[UPI Apps]
    end
    
    subgraph "Database"
        M[(Orders)]
        N[(Payments)]
        O[(Webhook Events)]
    end
    
    A -->|1. Create Order| F
    F -->|2. Process| G
    G -->|3. Payment Logic| H
    H -->|4. Create Intent| I
    I -->|5. API Call| K
    K -->|6. Payment Intent| I
    I -->|7. Return| H
    H -->|8. Save| M
    H -->|9. Save| N
    G -->|10. Return| F
    F -->|11. Response| A
    A -->|12. Navigate| B
    B -->|13. Initiate| D
    D -->|14. Open| L
    B -->|15. Poll Status| E
    E -->|16. GET Status| F
    F -->|17. Query| M
    M -->|18. Return| F
    F -->|19. Response| E
    L -->|20. Payment| K
    K -->|21. Webhook| J
    J -->|22. Process| H
    H -->|23. Update| M
    H -->|24. Update| N
    J -->|25. Store| O
    B -->|26. Success| C
    
    style A fill:#e1f5ff
    style B fill:#e1f5ff
    style K fill:#fff9c4
    style L fill:#fff9c4
    style M fill:#c8e6c9
    style N fill:#c8e6c9
```

---

## 📥 Data Flow Diagram

```mermaid
flowchart TD
    Start([User Places Order]) --> FrontendData[Frontend Data]
    
    FrontendData -->|Request| BackendData[Backend Processes]
    
    BackendData --> OrderData[Order Data Structure]
    BackendData --> PaymentData[Payment Data Structure]
    
    OrderData -->|Contains| O1[Order ID<br/>Order Number<br/>Items<br/>Total Amount<br/>Status<br/>Payment Method]
    
    PaymentData -->|Contains| P1[Payment Intent ID<br/>Amount in Paise<br/>Currency<br/>Status<br/>Expiry Time]
    
    BackendData -->|If UPI| RazorpayData[Razorpay Payment Intent]
    
    RazorpayData -->|Contains| R1[Razorpay Order ID<br/>Amount<br/>Status<br/>Receipt]
    
    BackendData -->|Save| Database[(Database)]
    
    Database -->|Stores| DB1[Order Document]
    Database -->|Stores| DB2[Payment Document]
    
    RazorpayData -->|User Pays| WebhookData[Webhook Event]
    
    WebhookData -->|Contains| W1[Event Type<br/>Payment ID<br/>Order ID<br/>Amount<br/>Status<br/>Signature]
    
    WebhookData -->|Process| UpdateData[Update Order Status]
    
    UpdateData -->|Updates| Database
    
    Database -->|Frontend Polls| StatusData[Status Response]
    
    StatusData -->|Contains| S1[Order Status<br/>Payment Status<br/>Payment Intent ID]
    
    StatusData -->|Shows| UserView[User Sees Result]
    
    style Start fill:#e1f5ff
    style Database fill:#c8e6c9
    style WebhookData fill:#ffccbc
    style UserView fill:#c8e6c9
```

---

## 🔔 Webhook Processing Flow

```mermaid
flowchart TD
    Razorpay[Razorpay Gateway] -->|Sends Webhook| WebhookEndpoint[POST /api/webhooks/razorpay]
    
    WebhookEndpoint --> VerifySignature{Verify Signature}
    
    VerifySignature -->|Invalid| Reject[Reject & Log Error]
    VerifySignature -->|Valid| CheckDuplicate{Check if Already Processed}
    
    CheckDuplicate -->|Already Processed| Skip[Skip - Return 200]
    CheckDuplicate -->|New Event| StoreEvent[Store Webhook Event in DB]
    
    StoreEvent --> DetermineType{Determine Event Type}
    
    DetermineType -->|payment.captured| PaymentSuccess[Handle Payment Success]
    DetermineType -->|payment.failed| PaymentFailed[Handle Payment Failure]
    DetermineType -->|payout.processed| PayoutSuccess[Handle Payout Success]
    DetermineType -->|payout.failed| PayoutFailed[Handle Payout Failure]
    
    PaymentSuccess --> GetPaymentDetails[Get Payment Details from Razorpay]
    GetPaymentDetails --> FindOrder[Find Order by Payment Intent ID]
    FindOrder --> VerifyAmount{Verify Amount Matches}
    
    VerifyAmount -->|Mismatch| LogWarning[Log Warning - Still Process]
    VerifyAmount -->|Matches| UpdateOrder[Update Order Status]
    
    UpdateOrder --> UpdateOrderDB[(Update Order:<br/>status: PAYMENT_CONFIRMED<br/>paymentStatus: paid)]
    UpdateOrderDB --> UpdatePayment[Update Payment Record]
    UpdatePayment --> UpdatePaymentDB[(Update Payment:<br/>status: completed<br/>gatewayTxnId)]
    UpdatePaymentDB --> CheckDealer{Has Dealer?}
    
    CheckDealer -->|Yes| InitiatePayout[Initiate Dealer Payout]
    CheckDealer -->|No| MarkProcessed[Mark Webhook as Processed]
    
    InitiatePayout --> CreatePayout[Create Payout via Razorpay]
    CreatePayout --> MarkProcessed
    
    MarkProcessed --> Return200[Return 200 OK to Razorpay]
    
    PaymentFailed --> UpdateOrderFailed[Update Order:<br/>status: PAYMENT_FAILED]
    UpdateOrderFailed --> MarkProcessed
    
    PayoutSuccess --> UpdatePayoutStatus[Update Payout Status: completed]
    PayoutFailed --> UpdatePayoutStatusFailed[Update Payout Status: failed]
    
    style Razorpay fill:#fff9c4
    style VerifySignature fill:#ffccbc
    style UpdateOrderDB fill:#c8e6c9
    style UpdatePaymentDB fill:#c8e6c9
    style Return200 fill:#c8e6c9
```

---

## 🔍 Payment Status Polling Flow

```mermaid
flowchart TD
    Start([Payment Status Screen Loads]) --> InitiatePayment[Initiate UPI Payment]
    
    InitiatePayment --> OpenUPIApp[Open UPI App via Deep Link]
    
    OpenUPIApp --> StartPolling[Start Polling Timer]
    
    StartPolling --> PollRequest[GET /api/user/orders/{id}/status]
    
    PollRequest --> BackendQuery[Backend Queries Database]
    
    BackendQuery --> CheckStatus{Check Payment Status}
    
    CheckStatus -->|paymentStatus: 'paid'| PaymentSuccess[Payment Successful!]
    CheckStatus -->|paymentStatus: 'failed'| PaymentFailed[Payment Failed]
    CheckStatus -->|paymentStatus: 'pending'| ContinuePolling[Continue Polling]
    
    ContinuePolling --> WaitInterval[Wait 3 seconds<br/>with exponential backoff]
    WaitInterval --> CheckTimeout{Timeout Reached?<br/>2 minutes max}
    
    CheckTimeout -->|No| PollRequest
    CheckTimeout -->|Yes| TimeoutError[Payment Timeout Error]
    
    PaymentSuccess --> UpdateUI[Update UI:<br/>Show Success Screen]
    UpdateUI --> NavigateSuccess[Navigate to Order Success]
    
    PaymentFailed --> UpdateUIFailed[Update UI:<br/>Show Failed Screen]
    UpdateUIFailed --> ShowOptions[Show Options:<br/>Retry or Choose COD]
    
    TimeoutError --> UpdateUITimeout[Update UI:<br/>Show Timeout Message]
    UpdateUITimeout --> ShowOptions
    
    style Start fill:#e1f5ff
    style PaymentSuccess fill:#c8e6c9
    style PaymentFailed fill:#ffcdd2
    style TimeoutError fill:#ffcdd2
    style NavigateSuccess fill:#c8e6c9
```

### Polling Mechanism Details:

- **Initial Interval**: 3 seconds
- **Exponential Backoff**: Increases by 1.5x each time (max 10 seconds)
- **Maximum Duration**: 2 minutes (120 seconds)
- **Stops When**: 
  - Payment status becomes `paid` → Success
  - Payment status becomes `failed` → Failure
  - Timeout reached → Error

---

## 🎯 Key Decision Points

```mermaid
graph TD
    A[User Places Order] --> B{Payment Method?}
    
    B -->|COD| C[Add ₹5 Charge]
    B -->|UPI| D[Validate Dealer Credentials]
    
    C --> E[Set Status: PENDING_COD]
    E --> F[Return Order Confirmation]
    
    D --> G{Dealer Has Credentials?}
    G -->|No| H[Error: Choose COD]
    G -->|Yes| I[Create Payment Intent]
    
    I --> J[Set Status: PENDING_PAYMENT]
    J --> K[Return Payment Action]
    K --> L[Open UPI App]
    
    L --> M{User Completes Payment?}
    M -->|Yes| N[Webhook: payment.captured]
    M -->|No/Timeout| O[Status: PAYMENT_FAILED]
    
    N --> P[Update: PAYMENT_CONFIRMED]
    P --> Q{Has Dealer?}
    Q -->|Yes| R[Initiate Payout]
    Q -->|No| S[Complete]
    
    R --> T{Payout Success?}
    T -->|Yes| U[Payout: completed]
    T -->|No| V[Payout: failed<br/>Payment still confirmed]
    
    style A fill:#e1f5ff
    style F fill:#c8e6c9
    style H fill:#ffcdd2
    style P fill:#c8e6c9
    style O fill:#ffcdd2
    style U fill:#c8e6c9
```

---

## 📋 Status Transition Diagram

```mermaid
stateDiagram-v2
    [*] --> ORDER_PLACED: User places order
    
    ORDER_PLACED --> PENDING_COD: COD selected
    ORDER_PLACED --> PENDING_PAYMENT: UPI selected
    
    PENDING_COD --> PAYMENT_CONFIRMED: Dealer collects COD
    PENDING_PAYMENT --> PAYMENT_CONFIRMED: Webhook: payment.captured
    PENDING_PAYMENT --> PAYMENT_FAILED: Webhook: payment.failed
    PENDING_PAYMENT --> PAYMENT_FAILED: Payment timeout (15 min)
    
    PAYMENT_CONFIRMED --> ORDER_CONFIRMED: System processes
    PAYMENT_FAILED --> [*]: Order cancelled
    
    ORDER_CONFIRMED --> SHIPPED: Order shipped
    SHIPPED --> DELIVERED: Order delivered
    DELIVERED --> [*]: Complete
    
    note right of PENDING_PAYMENT
        Expires after 15 minutes
        Frontend polls every 3 seconds
    end note
    
    note right of PAYMENT_CONFIRMED
        Payout to dealer initiated
        (if dealer exists)
    end note
```

---

## 🔐 Security & Validation Points

```mermaid
graph LR
    A[Payment Request] --> B[Authentication Check]
    B --> C[Idempotency Check]
    C --> D[Stock Validation]
    D --> E[Amount Calculation]
    E --> F[Payment Method Validation]
    
    F -->|UPI| G[Dealer Credentials Check]
    F -->|COD| H[COD Charge Added]
    
    G --> I[Payment Intent Creation]
    I --> J[Signature Verification]
    
    K[Webhook Received] --> L[Signature Verification]
    L --> M[Idempotency Check]
    M --> N[Amount Verification]
    N --> O[Order Matching]
    O --> P[Status Update]
    
    style B fill:#ffccbc
    style L fill:#ffccbc
    style M fill:#ffccbc
    style N fill:#ffccbc
```

---

## 📊 Summary Table

| Step | Component | Action | Result |
|------|-----------|--------|--------|
| 1 | Frontend | User selects payment method | Payment method chosen |
| 2 | Frontend | Sends order request | POST /api/user/orders |
| 3 | Backend | Creates order | Order document created |
| 4 | Backend | Processes payment method | COD: Add charge<br/>UPI: Create intent |
| 5 | Backend | Returns response | Order + paymentAction (if UPI) |
| 6 | Frontend | For UPI: Opens app | UPI app launched |
| 7 | Frontend | Starts polling | Status checked every 3s |
| 8 | User | Completes payment | Payment processed by Razorpay |
| 9 | Razorpay | Sends webhook | Webhook received |
| 10 | Backend | Processes webhook | Order status updated |
| 11 | Frontend | Polling detects change | UI updated |
| 12 | Backend | Initiates payout | Dealer payout created |

---

## 🎓 Key Concepts Explained

### 1. **Idempotency Key**
- Prevents duplicate orders if user clicks "Place Order" multiple times
- Generated on frontend, sent in request headers
- Backend checks if order with same key already exists

### 2. **Payment Intent**
- A Razorpay concept: reservation of payment amount
- Created before user pays
- Has expiry time (15 minutes)
- Links to order via paymentIntentId

### 3. **Deep Link**
- Special URL that opens UPI app directly
- Format: `razorpay://pay?amount=X&currency=INR&order_id=Y`
- Frontend uses React Native Linking to open it

### 4. **Webhook**
- Razorpay sends HTTP POST to your server when payment completes
- Contains payment details and signature
- Must verify signature to ensure it's from Razorpay
- Processed asynchronously (returns 200 immediately)

### 5. **Polling**
- Frontend checks order status repeatedly
- Needed because webhooks may be delayed
- Uses exponential backoff to reduce server load
- Stops when payment status changes

### 6. **Payout**
- Separate from customer payment
- Transfers money from your account to dealer's account
- Happens after payment is confirmed
- Can succeed or fail independently

---

## 🚀 Quick Reference

### COD Flow:
```
User → Frontend → Backend → Add ₹5 → Save Order → Return → Success Screen
```

### UPI Flow:
```
User → Frontend → Backend → Razorpay Intent → UPI App → User Pays → 
Razorpay → Webhook → Backend Updates → Frontend Polling Detects → Success Screen
```

---

## 📝 Notes

- All monetary amounts are stored in **paise** (₹1 = 100 paise) in Razorpay
- Frontend displays amounts in **rupees** (converts paise/100)
- Webhooks are processed asynchronously - always return 200 OK quickly
- Polling has a maximum duration of 2 minutes
- Payment intents expire after 15 minutes if not completed
- COD orders wait for manual collection by dealer/admin

---

**Last Updated**: Payment System Flow Documentation
**Version**: 1.0

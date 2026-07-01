import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Order } from '../models/Order';
import { ServiceBooking } from '../models/ServiceBooking';
import { Service } from '../models/Service';
import { SignUp } from '../models/SignUp';
import { Dealer } from '../models/Dealer';
import { BusinessRegistration } from '../models/BusinessRegistration';
import { Product } from '../models/Product';
import { logger } from '../utils/logger';
import { IJwtPayload } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper to authenticate requests via header or query parameter
const authenticateInvoiceRequest = async (req: Request) => {
  let token = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    throw new Error('No token provided');
  }

  const decoded = jwt.verify(token, JWT_SECRET) as IJwtPayload;
  const user = await SignUp.findById(decoded.userId);
  if (!user || user.status !== 'active') {
    throw new Error('Unauthorized');
  }
  return { userId: String(user._id), email: user.email, role: decoded.role || [] };
};

/** Resolve dealer business ID (BusinessRegistration._id) from authenticated user */
async function getDealerBusinessIdForUser(userId: string, role: string[]): Promise<string | null> {
  if (!role.includes('dealer')) return null;
  const businessRegistration = await BusinessRegistration.findOne({ userId }).select('_id').lean();
  return businessRegistration ? String(businessRegistration._id) : null;
}

/** Match dealer order access rules used by dealer order APIs */
async function checkDealerInvoiceAccess(
  userId: string,
  role: string[],
  order: { dealerId?: string; items: Array<{ productId: string }> },
): Promise<boolean> {
  const dealerBusinessId = await getDealerBusinessIdForUser(userId, role);
  if (!dealerBusinessId) return false;

  if (order.dealerId === dealerBusinessId) return true;

  const dealerProducts = await Product.find({ userId: dealerBusinessId }).select('_id').lean();
  const dealerProductIds = dealerProducts.map((p) => String(p._id));
  if (dealerProductIds.length === 0) return false;

  return order.items.some((item) => dealerProductIds.includes(item.productId));
}

async function resolveDealerInfoForInvoice(dealerId?: string) {
  if (!dealerId) return null;

  let businessReg = await BusinessRegistration.findById(dealerId).lean();
  if (!businessReg) {
    businessReg = await BusinessRegistration.findOne({ userId: dealerId }).lean();
  }
  if (!businessReg) return null;

  const dealerUser = await SignUp.findById(businessReg.userId).select('email').lean();
  if (!dealerUser) return null;

  const dealerDoc = await Dealer.findOne({ email: dealerUser.email }).lean();
  if (!dealerDoc) return null;

  return {
    name: dealerDoc.name,
    businessName: dealerDoc.businessName,
    phone: dealerDoc.phone,
    email: dealerDoc.email,
    address: dealerDoc.address,
    gst: businessReg.gst,
  };
};

// CSS styles for invoice template
const getInvoiceStyles = () => `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  
  :root {
    --primary-color: #E60012;
    --primary-hover: #b3000e;
    --text-main: #1e293b;
    --text-muted: #64748b;
    --bg-light: #f8fafc;
    --border-color: #e2e8f0;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: var(--text-main);
    background-color: #f1f5f9;
    margin: 0;
    padding: 40px 20px;
    line-height: 1.5;
  }

  .invoice-container {
    max-width: 850px;
    margin: 0 auto;
    background: #ffffff;
    padding: 50px;
    border-radius: 20px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
    border: 1px solid var(--border-color);
  }

  .control-bar {
    max-width: 850px;
    margin: 0 auto 20px auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 600;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    border: none;
  }

  .btn-primary {
    background-color: var(--primary-color);
    color: white;
  }

  .btn-primary:hover {
    background-color: var(--primary-hover);
  }

  .btn-secondary {
    background-color: #e2e8f0;
    color: #475569;
  }

  .btn-secondary:hover {
    background-color: #cbd5e1;
  }

  .invoice-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid var(--border-color);
    padding-bottom: 30px;
    margin-bottom: 30px;
  }

  .brand-logo {
    font-size: 28px;
    font-weight: 800;
    color: var(--primary-color);
    letter-spacing: -0.05em;
  }

  .brand-sub {
    font-size: 12px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 600;
    margin-top: 2px;
  }

  .invoice-title-block {
    text-align: right;
  }

  .invoice-title {
    font-size: 32px;
    font-weight: 800;
    margin: 0;
    color: #0f172a;
    letter-spacing: -0.03em;
  }

  .invoice-number {
    font-size: 14px;
    color: var(--text-muted);
    font-weight: 500;
    margin-top: 4px;
  }

  .status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 8px;
  }

  .status-paid, .status-delivered, .status-scheduled, .status-completed {
    background-color: #d1fae5;
    color: #065f46;
  }

  .status-pending, .status-new, .status-in_progress, .status-awaiting {
    background-color: #fef3c7;
    color: #92400e;
  }

  .status-cancelled, .status-failed {
    background-color: #fee2e2;
    color: #991b1b;
  }

  .details-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    margin-bottom: 40px;
  }

  .details-block h4 {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    margin: 0 0 10px 0;
    font-weight: 600;
  }

  .details-block p {
    margin: 0 0 6px 0;
    font-size: 14px;
  }

  .details-block .name {
    font-weight: 700;
    color: #0f172a;
    font-size: 15px;
  }

  .items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 30px;
  }

  .items-table th {
    background-color: var(--bg-light);
    border-bottom: 2px solid var(--border-color);
    padding: 12px 16px;
    text-align: left;
    font-size: 12px;
    text-transform: uppercase;
    font-weight: 600;
    color: var(--text-muted);
  }

  .items-table td {
    padding: 16px;
    border-bottom: 1px solid var(--border-color);
    font-size: 14px;
  }

  .items-table .item-details {
    font-weight: 600;
    color: #0f172a;
  }

  .summary-section {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 40px;
  }

  .summary-table {
    width: 300px;
    border-collapse: collapse;
  }

  .summary-table td {
    padding: 8px 16px;
    font-size: 14px;
  }

  .summary-table tr.total-row td {
    border-top: 2px solid var(--border-color);
    font-weight: 800;
    font-size: 18px;
    color: var(--primary-color);
    padding-top: 16px;
  }

  .footer-notes {
    border-top: 1px solid var(--border-color);
    padding-top: 30px;
    text-align: center;
    font-size: 12px;
    color: var(--text-muted);
  }

  .meta-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 30px;
  }

  .meta-card {
    background: var(--bg-light);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 14px 16px;
  }

  .meta-card h5 {
    margin: 0 0 6px 0;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    font-weight: 600;
  }

  .meta-card p {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
  }

  .lifecycle {
    margin-bottom: 32px;
    padding: 20px;
    border-radius: 14px;
    border: 1px solid var(--border-color);
    background: #fff;
  }

  .lifecycle h4 {
    margin: 0 0 16px 0;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    font-weight: 700;
  }

  .lifecycle-steps {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }

  .lifecycle-step {
    flex: 1;
    min-width: 90px;
    text-align: center;
    position: relative;
  }

  .lifecycle-dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    margin: 0 auto 8px auto;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    border: 2px solid #e2e8f0;
    background: #f8fafc;
    color: #64748b;
  }

  .lifecycle-dot.done {
    background: #10b981;
    border-color: #10b981;
    color: #fff;
  }

  .lifecycle-dot.active {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: #fff;
  }

  .lifecycle-label {
    font-size: 10px;
    font-weight: 700;
    color: #334155;
    line-height: 1.3;
  }

  .timeline-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 30px;
  }

  .timeline-table th,
  .timeline-table td {
    padding: 10px 14px;
    border-bottom: 1px solid var(--border-color);
    font-size: 13px;
    text-align: left;
  }

  .timeline-table th {
    background: var(--bg-light);
    font-size: 11px;
    text-transform: uppercase;
    color: var(--text-muted);
    font-weight: 700;
  }

  @media print {
    body {
      background-color: #ffffff;
      padding: 0;
    }
    .invoice-container {
      box-shadow: none;
      border: none;
      padding: 0;
    }
    .no-print {
      display: none !important;
    }
  }
`;

const DEALER_ORDER_STEPS = [
  'Order Placed',
  'Accepted',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

function getDealerOrderStepIndex(status: string): number {
  const key = (status || '').toLowerCase();
  switch (key) {
    case 'order_placed':
    case 'payment_confirmed':
    case 'pending_cod':
    case 'pending_payment':
      return 0;
    case 'order_confirmed':
      return 1;
    case 'packed':
      return 2;
    case 'shipped':
      return 3;
    case 'out_for_delivery':
      return 4;
    case 'delivered':
      return 5;
    default:
      return -1;
  }
}

function renderLifecycleHtml(status: string): string {
  const activeIdx = getDealerOrderStepIndex(status);
  const steps = DEALER_ORDER_STEPS.map((label, idx) => {
    const done = activeIdx > idx;
    const active = activeIdx === idx;
    const dotClass = done ? 'done' : active ? 'active' : '';
    const marker = done ? '✓' : String(idx + 1);
    return `
      <div class="lifecycle-step">
        <div class="lifecycle-dot ${dotClass}">${marker}</div>
        <div class="lifecycle-label">${label}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="lifecycle">
      <h4>Order Fulfillment Progress</h4>
      <div class="lifecycle-steps">${steps}</div>
    </div>
  `;
}

function renderTimelineHtml(timeline: Array<{ status: string; timestamp: Date | string; notes?: string; actor?: string }> = []): string {
  if (!timeline.length) return '';

  const rows = [...timeline]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((event) => {
      const when = new Date(event.timestamp).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      return `
        <tr>
          <td>${event.status.replace(/_/g, ' ')}</td>
          <td>${when}</td>
          <td>${event.actor || 'system'}</td>
          <td>${event.notes || '—'}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <div style="margin-bottom: 30px;">
      <h4 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin: 0 0 12px 0;">Status History</h4>
      <table class="timeline-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Date & Time</th>
            <th>Updated By</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// GET /api/invoices/order/:id
export const getOrderInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authenticateInvoiceRequest(req);
    const orderId = req.params.id;

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).send('<h1>Order not found</h1>');
      return;
    }

    // Check authorization
    const isOwner = order.userId === user.userId;
    const isDealerWithAccess = await checkDealerInvoiceAccess(user.userId, user.role, order);
    const isAdmin = user.role.includes('admin');

    if (!isOwner && !isDealerWithAccess && !isAdmin) {
      res.status(403).send('<h1>Forbidden: You do not have access to this invoice</h1>');
      return;
    }

    // Fetch customer details
    const customerUser = await SignUp.findById(order.userId).select('name email phone').lean();

    // Fetch dealer details
    const dealerInfo = await resolveDealerInfoForInvoice(order.dealerId);

    const expectedDelivery = order.expectedDeliveryDate
      ? new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : order.tracking?.estimatedDelivery
        ? new Date(order.tracking.estimatedDelivery).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : 'Not scheduled';

    const trackingBlock = order.tracking
      ? `
        <div class="meta-card">
          <h5>Tracking</h5>
          <p>${order.tracking.carrier} · ${order.tracking.trackingNumber}</p>
        </div>
      `
      : `
        <div class="meta-card">
          <h5>Tracking</h5>
          <p>Not assigned yet</p>
        </div>
      `;

    const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const formattedStatus = order.status.replace(/_/g, ' ');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice - ${order.orderNumber}</title>
          <style>${getInvoiceStyles()}</style>
        </head>
        <body>
          <div class="control-bar no-print">
            <button class="btn btn-secondary" onclick="window.history.back()">← Back</button>
            <button class="btn btn-primary" onclick="window.print()">Print / Save as PDF</button>
          </div>
          <div class="invoice-container">
            <div class="invoice-header">
              <div style="display: flex; align-items: center; gap: 15px;">
                <img src="https://res.cloudinary.com/dzguxkrky/image/upload/v1779389686/motonode/notifications/rcggfm3pp5gpcvgzn9n0.jpg" alt="Motonode Logo" style="height: 50px; border-radius: 8px;" />
                <div>
                  <div class="brand-logo">motonode</div>
                  <div class="brand-sub">Car Connect Network</div>
                </div>
              </div>
              <div class="invoice-title-block">
                <h1 class="invoice-title">INVOICE</h1>
                <div class="invoice-number">Order #${order.orderNumber}</div>
                <div class="status-badge status-${order.status.toLowerCase()}">${formattedStatus}</div>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; background-color: var(--bg-light); padding: 15px 25px; border-radius: 12px; border: 1px solid var(--border-color);">
              <div style="font-size: 13px; color: var(--text-muted); font-weight: 500;">
                Scan this barcode to verify order status on delivery.
              </div>
              <svg id="barcode" style="background: transparent;"></svg>
            </div>

            <div class="meta-grid">
              <div class="meta-card">
                <h5>Order Reference</h5>
                <p>#${order.orderNumber}</p>
              </div>
              <div class="meta-card">
                <h5>Expected Delivery</h5>
                <p>${expectedDelivery}</p>
              </div>
              ${trackingBlock}
            </div>

            ${renderLifecycleHtml(order.status)}

            <div class="details-grid">
              <div class="details-block">
                <h4>Bill To (Customer)</h4>
                <p class="name">${customerUser?.name || 'Customer'}</p>
                <p>Phone: ${customerUser?.phone || 'N/A'}</p>
                <p>Email: ${customerUser?.email || 'N/A'}</p>
                <p style="margin-top: 8px; font-weight: 500;">Shipping Address:</p>
                <p>${order.shippingAddress?.street || ''}, ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.zipCode || ''}</p>
                <p style="margin-top: 8px; font-weight: 500;">Billing Address:</p>
                <p>${order.billingAddress?.street || order.shippingAddress?.street || ''}, ${order.billingAddress?.city || order.shippingAddress?.city || ''}, ${order.billingAddress?.state || order.shippingAddress?.state || ''} - ${order.billingAddress?.zipCode || order.shippingAddress?.zipCode || ''}</p>
              </div>
              <div class="details-block">
                <h4>Bill From (Dealer)</h4>
                ${
                  dealerInfo
                    ? `
                  <p class="name">${dealerInfo.businessName || dealerInfo.name}</p>
                  <p>Phone: ${dealerInfo.phone || 'N/A'}</p>
                  <p>Email: ${dealerInfo.email || 'N/A'}</p>
                  <p>${dealerInfo.address || ''}</p>
                  ${dealerInfo.gst ? `<p style="margin-top: 8px;">GSTIN: <strong>${dealerInfo.gst}</strong></p>` : ''}
                `
                    : '<p class="name">Direct Car Connect Fullfilment</p>'
                }
                <p style="margin-top: 12px; color: var(--text-muted)">Invoice Date: <strong>${formattedDate}</strong></p>
                <p style="color: var(--text-muted)">Payment: <strong style="text-transform: uppercase;">${order.paymentMethod.replace(/_/g, ' ')} (${order.paymentStatus})</strong></p>
                <p style="color: var(--text-muted)">Order ID: <strong>${String(order._id)}</strong></p>
              </div>
            </div>

            ${renderTimelineHtml(order.timeline as any)}

            <table class="items-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>SKU / ID</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items
                  .map(
                    (item) => `
      <tr>
        <td class="item-details">${item.name}</td>
        <td style="font-size: 12px; color: var(--text-muted);">${item.productId}</td>
        <td>${item.quantity}</td>
        <td>₹${item.price.toFixed(2)}</td>
        <td>₹${item.total.toFixed(2)}</td>
      </tr>
    `,
                  )
                  .join('')}
              </tbody>
            </table>

            <div class="summary-section">
              <table class="summary-table">
                <tr>
                  <td>Subtotal</td>
                  <td style="text-align: right;">₹${order.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Shipping</td>
                  <td style="text-align: right;">₹${order.shipping.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Tax (GST)</td>
                  <td style="text-align: right;">₹${order.tax.toFixed(2)}</td>
                </tr>
                ${
                  order.codCharge > 0
                    ? `
                  <tr>
                    <td>COD Charge</td>
                    <td style="text-align: right;">₹${order.codCharge.toFixed(2)}</td>
                  </tr>
                `
                    : ''
                }
                <tr class="total-row">
                  <td>Grand Total</td>
                  <td style="text-align: right;">₹${order.totalAmount.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <div class="footer-notes">
              <p>Thank you for purchasing through Motonode.</p>
              <p style="margin-top: 8px; font-size: 10px; opacity: 0.7;">This is a computer-generated invoice and does not require a physical signature.</p>
            </div>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <script>
            window.onload = function() {
              JsBarcode("#barcode", "${order.orderNumber}", {
                format: "CODE128",
                lineColor: "#E60012",
                width: 1.5,
                height: 40,
                displayValue: true
              });
            }
          </script>
        </body>
      </html>
    `;

    res.status(200).send(htmlContent);
  } catch (error: any) {
    logger.error('Error rendering order invoice:', error);
    res.status(500).send(`<h1>Internal Server Error</h1><p>${error.message}</p>`);
  }
};

// GET /api/invoices/service/:id
export const getServiceInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authenticateInvoiceRequest(req);
    const bookingId = req.params.id;

    const booking = await ServiceBooking.findById(bookingId);
    if (!booking) {
      res.status(404).send('<h1>Service Booking not found</h1>');
      return;
    }

    // Check authorization
    const isCustomer = booking.userId === user.userId;
    let isDealer = false;
    const dealerReg = await BusinessRegistration.findById(booking.dealerId);
    if (dealerReg && String(dealerReg.userId) === String(user.userId)) {
      isDealer = true;
    }
    const isAdmin = user.role.includes('admin');

    if (!isCustomer && !isDealer && !isAdmin) {
      res.status(403).send('<h1>Forbidden: You do not have access to this invoice</h1>');
      return;
    }

    // Fetch customer details
    const customerUser = await SignUp.findById(booking.userId).select('name email phone').lean();

    // Fetch service info
    const service = await Service.findById(booking.serviceId).lean();

    // Fetch dealer business info
    let dealerInfo = null;
    if (dealerReg) {
      const dealerUser = await SignUp.findById(dealerReg.userId).select('email').lean();
      const dealerEmail = dealerUser?.email || '';
      const dealerDoc = dealerEmail ? await Dealer.findOne({ email: dealerEmail }).lean() : null;
      dealerInfo = {
        name: dealerReg.businessName || dealerDoc?.name || 'Dealer Workshop',
        phone: dealerReg.phone || dealerDoc?.phone || 'N/A',
        email: dealerEmail || dealerDoc?.email || 'N/A',
        address: dealerReg.address || dealerDoc?.address || 'N/A',
      };
    }

    const price = service?.price ?? 0;
    const duration = service?.durationMinutes ?? 0;

    const formattedBookingDate = new Date(booking.bookingDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const formattedCreatedDate = new Date(booking.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Service Booking Receipt - ${bookingId.slice(-8).toUpperCase()}</title>
          <style>${getInvoiceStyles()}</style>
        </head>
        <body>
          <div class="control-bar no-print">
            <button class="btn btn-secondary" onclick="window.history.back()">← Back</button>
            <button class="btn btn-primary" onclick="window.print()">Print / Save as PDF</button>
          </div>
          <div class="invoice-container">
            <div class="invoice-header">
              <div style="display: flex; align-items: center; gap: 15px;">
                <img src="https://res.cloudinary.com/dzguxkrky/image/upload/v1779389686/motonode/notifications/rcggfm3pp5gpcvgzn9n0.jpg" alt="Motonode Logo" style="height: 50px; border-radius: 8px;" />
                <div>
                  <div class="brand-logo">motonode</div>
                  <div class="brand-sub">Workshop Service Network</div>
                </div>
              </div>
              <div class="invoice-title-block">
                <h1 class="invoice-title">RECEIPT</h1>
                <div class="invoice-number">Booking #${bookingId.slice(-8).toUpperCase()}</div>
                <div class="status-badge status-${booking.status.toLowerCase()}">${booking.status.replace(/_/g, ' ')}</div>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; background-color: var(--bg-light); padding: 15px 25px; border-radius: 12px; border: 1px solid var(--border-color);">
              <div style="font-size: 13px; color: var(--text-muted); font-weight: 500;">
                Scan this barcode to verify service details at the workshop.
              </div>
              <svg id="barcode" style="background: transparent;"></svg>
            </div>

            <div class="details-grid">
              <div class="details-block">
                <h4>Customer Details</h4>
                <p class="name">${customerUser?.name || 'Customer'}</p>
                <p>Phone: ${customerUser?.phone || 'N/A'}</p>
                <p>Email: ${customerUser?.email || 'N/A'}</p>
                ${
                  booking.vehicleInfo?.brand || booking.vehicleInfo?.model
                    ? `
                  <p style="margin-top: 12px; font-weight: 500; color: var(--text-muted)">Vehicle Details:</p>
                  <p><strong>${booking.vehicleInfo.brand || ''} ${booking.vehicleInfo.model || ''}</strong></p>
                  ${booking.vehicleInfo.registrationNumber ? `<p>Reg Number: ${booking.vehicleInfo.registrationNumber}</p>` : ''}
                `
                    : ''
                }
              </div>
              <div class="details-block">
                <h4>Workshop Details</h4>
                ${
                  dealerInfo
                    ? `
                  <p class="name">${dealerInfo.name}</p>
                  <p>Phone: ${dealerInfo.phone}</p>
                  <p>Email: ${dealerInfo.email}</p>
                  <p>${dealerInfo.address}</p>
                `
                    : '<p class="name">Direct Car Connect Workshop</p>'
                }
                <p style="margin-top: 12px; color: var(--text-muted)">Booking Date: <strong>${formattedBookingDate} at ${booking.bookingTime || 'N/A'}</strong></p>
                <p style="color: var(--text-muted)">Service Type: <strong style="text-transform: uppercase;">${service?.serviceType?.replace(/_/g, ' ') || 'General'}</strong></p>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Requested Service Description</th>
                  <th>Duration</th>
                  <th style="text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="item-details">
                    <div>${service?.name || booking.serviceRequest}</div>
                    <div style="font-size: 12px; color: var(--text-muted); font-weight: normal; margin-top: 4px;">
                      ${service?.description || booking.serviceRequest}
                    </div>
                  </td>
                  <td>${duration} minutes</td>
                  <td style="text-align: right; font-weight: 600;">₹${price.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div class="summary-section">
              <table class="summary-table">
                <tr>
                  <td>Service Fee</td>
                  <td style="text-align: right;">₹${price.toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                  <td>Grand Total</td>
                  <td style="text-align: right;">₹${price.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <div class="footer-notes">
              <p>Receipt created on ${formattedCreatedDate}</p>
              <p>Thank you for purchasing through Motonode.</p>
              <p style="margin-top: 8px; font-size: 10px; opacity: 0.7;">This is a computer-generated receipt and does not require a physical signature.</p>
            </div>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <script>
            window.onload = function() {
              JsBarcode("#barcode", "${bookingId.slice(-8).toUpperCase()}", {
                format: "CODE128",
                lineColor: "#E60012",
                width: 1.5,
                height: 40,
                displayValue: true
              });
            }
          </script>
        </body>
      </html>
    `;

    res.status(200).send(htmlContent);
  } catch (error: any) {
    logger.error('Error rendering service receipt:', error);
    res.status(500).send(`<h1>Internal Server Error</h1><p>${error.message}</p>`);
  }
};

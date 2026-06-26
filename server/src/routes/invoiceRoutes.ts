import { Router } from 'express';
import { getOrderInvoice, getServiceInvoice } from '../controllers/invoiceController';

const router = Router();

// Routes for downloading invoices/receipts
router.get('/order/:id', getOrderInvoice);
router.get('/service/:id', getServiceInvoice);

export default router;

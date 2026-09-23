import { Router } from 'express';
import { receiptController } from '../controllers/receiptController';
import { authenticateJwt } from '../middlewares/auth';
import { uploadMiddleware } from '../middlewares/upload';

const router = Router();

router.use(authenticateJwt);

router.post('/upload', uploadMiddleware.single('image'), (req, res) =>
  receiptController.uploadAndProcess(req, res)
);
router.get('/:id', (req, res) => receiptController.getReceipt(req, res));
router.post('/:id/confirm', (req, res) => receiptController.confirmReceipt(req, res));
router.post('/:id/dismiss-duplicate', (req, res) => receiptController.dismissDuplicate(req, res));

export default router;

import { Router } from 'express';
import { transactionController } from '../controllers/transactionController';
import { authenticateJwt } from '../middlewares/auth';

const router = Router();

router.use(authenticateJwt);

router.get('/', (req, res) => transactionController.getTransactions(req, res));
router.post('/manual', (req, res) => transactionController.createManualExpense(req, res));
router.get('/:id', (req, res) => transactionController.getTransactionById(req, res));
router.delete('/:id', (req, res) => transactionController.deleteTransaction(req, res));

export default router;

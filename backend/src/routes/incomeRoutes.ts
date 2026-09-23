import { Router } from 'express';
import { incomeController } from '../controllers/incomeController';
import { authenticateJwt } from '../middlewares/auth';

const router = Router();

router.use(authenticateJwt);

router.get('/', (req, res) => incomeController.getIncomes(req, res));
router.post('/', (req, res) => incomeController.createIncome(req, res));
router.delete('/:id', (req, res) => incomeController.deleteIncome(req, res));

export default router;

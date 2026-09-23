import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController';
import { authenticateJwt } from '../middlewares/auth';

const router = Router();

router.use(authenticateJwt);

router.get('/summary', (req, res) => dashboardController.getSummary(req, res));
router.get('/export/csv', (req, res) => dashboardController.exportCsv(req, res));
router.get('/reports', (req, res) => dashboardController.getFinancialReport(req, res));

export default router;

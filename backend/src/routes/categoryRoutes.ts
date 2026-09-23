import { Router } from 'express';
import { categoryController } from '../controllers/categoryController';
import { authenticateJwt } from '../middlewares/auth';

const router = Router();

router.use(authenticateJwt);

router.get('/', (req, res) => categoryController.getCategories(req, res));
router.post('/', (req, res) => categoryController.createCategory(req, res));
router.put('/:id', (req, res) => categoryController.updateCategory(req, res));
router.delete('/:id', (req, res) => categoryController.deleteCategory(req, res));
router.get('/rules', (req, res) => categoryController.getRules(req, res));
router.post('/rules', (req, res) => categoryController.createRule(req, res));

export default router;

import { Router } from 'express';
import { inventoryController } from '../controllers/inventoryController';
import { authenticateJwt } from '../middlewares/auth';

const router = Router();

router.use(authenticateJwt);

router.get('/', (req, res) => inventoryController.getInventory(req, res));
router.post('/movement', (req, res) => inventoryController.recordMovement(req, res));
router.get('/shopping-list', (req, res) => inventoryController.getShoppingList(req, res));
router.get('/kardex/:productId', (req, res) => inventoryController.getProductKardex(req, res));
router.post('/product', (req, res) => inventoryController.createProduct(req, res));
router.put('/product/:productId', (req, res) => inventoryController.updateProductSettings(req, res));

export default router;

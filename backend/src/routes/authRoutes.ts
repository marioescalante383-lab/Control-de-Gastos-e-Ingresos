import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticateJwt } from '../middlewares/auth';

const router = Router();

router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.get('/me', authenticateJwt, (req, res) => authController.me(req, res));
router.get('/google/url', authenticateJwt, (req, res) => authController.getGoogleAuthUrl(req, res));
router.get('/google/callback', (req, res) => authController.handleGoogleCallback(req, res));

export default router;

import { Router } from 'express';
import { serveFile } from './file.controller.js';

const router = Router();

router.get('/:category/:filename', serveFile);

export default router;

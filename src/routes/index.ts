import { Router } from 'express';
import v1Routes from './v1.js';

const router = Router();

// API versions. Add /v2 here when it exists.
router.use('/v1', v1Routes);

export default router;

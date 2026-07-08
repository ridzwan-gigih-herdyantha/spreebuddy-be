import { Router } from "express";
import { listProducts } from "./product.controller.js";

const router = Router();

// All user-management routes are authenticated + admin only.
router.get('/', listProducts);

export default router;
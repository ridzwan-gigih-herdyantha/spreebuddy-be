import { Router } from "express";
import { listProducts, getProduct } from "./product.controller.js";

const router = Router();

// All user-management routes are authenticated + admin only.
router.get('/', listProducts);
router.get('/:id', getProduct);

export default router;
import express from "express";
import { isBuyer, isSeller, isUser } from "../auth/auth.middleware.js";
import {
  addProduct,
  deleteProduct,
  getProductDetails,
  getAllProducts,
  getSellerProducts,
} from "./product.service.js";

const router = express.Router();

// add product
router.post("/product/add", isSeller, addProduct);

// delete product
router.delete("/product/delete/:id", isSeller, deleteProduct);

// get product details
router.get("/product/details/:id", isUser, getProductDetails);

// get products by buyer
router.post("/product/buyer/all", isBuyer, getAllProducts);

// get products by seller
router.post("/product/seller/all", isSeller, getSellerProducts);

export default router;

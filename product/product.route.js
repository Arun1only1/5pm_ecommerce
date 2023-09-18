import express from "express";
import { isBuyer, isSeller, isUser } from "../auth/auth.middleware.js";
import {
  addProduct,
  deleteProduct,
  getProductDetails,
  getAllProducts,
  getSellerProducts,
  editProduct,
  getLatestProducts,
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

// edit product
// seller
// can edit own product
router.put("/product/edit/:id", isSeller, editProduct);

// get latest product
router.get("/product/latest/:count", isUser, getLatestProducts);

export default router;

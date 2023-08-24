import mongoose from "mongoose";
import { Product } from "./product.entity.js";
import {
  addProductValidationSchema,
  getAllProductsValidation,
} from "./product.validation.schema.js";
import { checkMongooseIdValidity } from "../utils/utils.js";
import { checkIfProductExists } from "./product.functions.js";

// *add product
export const addProduct = async (req, res) => {
  //  extract new product from req.body
  const newProduct = req.body;

  // validate new product
  try {
    await addProductValidationSchema.validateAsync(newProduct);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }

  //   add sellerId
  newProduct.sellerId = req.userInfo._id;

  // add product
  await Product.create(newProduct);

  return res.status(201).send({ message: "Product is added successfully." });
};

// *delete product
export const deleteProduct = async (req, res) => {
  try {
    // extract id from params
    const productId = req.params.id;

    //validate id for mongo id validity
    const isValidMongoId = checkMongooseIdValidity(productId);

    // if not valid id, terminate
    if (!isValidMongoId) {
      return res.status(400).send({ message: "Invalid mongo id." });
    }

    // check for product existence
    const product = await checkIfProductExists({ _id: productId });

    const loggedInUserId = req.userInfo._id;

    //   logged in user must be owner of that product
    isOwnerOfProduct(loggedInUserId, product.sellerId);

    //   delete product
    await Product.deleteOne({ _id: productId });

    return res
      .status(200)
      .send({ message: "Product is deleted successfully." });
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

// *get user details
export const getProductDetails = async (req, res) => {
  // extract product id params from req
  const productId = req.params.id;

  //validate id for mongo id validity
  const isValidMongoId = checkMongooseIdValidity(productId);

  // if not valid id, terminate
  if (!isValidMongoId) {
    return res.status(400).send({ message: "Invalid mongo id." });
  }

  // check if product exists
  const product = await Product.findOne({ _id: productId });

  // if not product,terminate
  if (!product) {
    return res.status(404).send({ message: "Product does not exist." });
  }

  // return product
  return res.status(200).send(product);
};

// * get all products
export const getAllProducts = async (req, res) => {
  // extract query params from req.body
  const query = req.body;

  // validate query params
  try {
    await getAllProductsValidation.validateAsync(query);
  } catch (error) {
    // if not valid, terminate
    return res.status(400).send({ message: error.message });
  }

  // find products
  // calculate skip
  const skip = (query.page - 1) * query.limit;

  const products = await Product.aggregate([
    {
      $match: {},
    },
    {
      $skip: skip,
    },
    {
      $limit: query.limit,
    },
  ]);

  // return products
  return res.status(200).send(products);
};

// * get seller products
export const getSellerProducts = async (req, res) => {
  const query = req.body;

  const sellerIdFromAuthMiddleware = req.userInfo._id;
  try {
    await getAllProductsValidation.validateAsync(query);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }

  const skip = (query.page - 1) * query.limit;

  const products = await Product.aggregate([
    {
      $match: {
        sellerId: sellerIdFromAuthMiddleware,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: query.limit,
    },
  ]);

  return res.status(200).send(products);
};

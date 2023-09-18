import { checkMongooseIdValidity } from "../utils/utils.js";
import { Product } from "./product.entity.js";
import { checkIfProductExists, isOwnerOfProduct } from "./product.functions.js";
import {
  addProductValidationSchema,
  countValidationSchema,
  getAllProductsValidation,
} from "./product.validation.schema.js";

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
  newProduct.sellerId = req.loggedInUser._id;

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

    const loggedInUserId = req.loggedInUser._id;

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

  // match
  let match = {};

  if (query?.searchText) {
    match.name = { $regex: query.searchText, $options: "i" };
  }

  // price
  let price = {};
  if (query?.minPrice) {
    price = { $gte: query.minPrice };
  }
  if (query?.maxPrice) {
    price = { ...price, $lte: query.maxPrice };
  }

  // category
  if (query?.category?.length) {
    match.category = { $in: query.category };
  }

  if (Object.entries(price).length > 0) {
    match.price = price;
  }

  // calculate skip
  const skip = (query.page - 1) * query.limit;

  const products = await Product.aggregate([
    {
      $match: match,
    },
    {
      $skip: skip,
    },
    {
      $limit: query.limit,
    },
  ]);

  const totalItems = await Product.find({}).count();

  const totalPage = Math.ceil(totalItems / query.limit);

  // return products
  return res.status(200).send({ products, totalPage });
};

// * get seller products
export const getSellerProducts = async (req, res) => {
  const query = req.body;

  const sellerIdFromAuthMiddleware = req.loggedInUser._id;
  try {
    await getAllProductsValidation.validateAsync(query);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }

  let match = query.searchText
    ? {
        sellerId: sellerIdFromAuthMiddleware,
        name: { $regex: query.searchText, $options: "i" },
      }
    : {
        sellerId: sellerIdFromAuthMiddleware,
      };

  const skip = (query.page - 1) * query.limit;

  const products = await Product.aggregate([
    {
      $match: match,
    },
    {
      $skip: skip,
    },
    {
      $limit: query.limit,
    },
    {
      $project: {
        name: 1,
        company: 1,
        price: 1,
        category: 1,
        sellerId: 1,
        description: 1,
        imageUrl: 1,
      },
    },
  ]);

  const totalProducts = await Product.find({
    sellerId: sellerIdFromAuthMiddleware,
  }).count();

  const totalPage = Math.ceil(totalProducts / query.limit);

  return res.status(200).send({ products, totalPage });
};

export const editProduct = async (req, res) => {
  // get logged  in userId from isSeller middle
  const loggedInUserId = req.loggedInUser._id;

  const productId = req.params.id;
  // validate product id
  const isValidMongoId = checkMongooseIdValidity(productId);

  if (!isValidMongoId) {
    return res.status(400).send({ message: "Invalid mongo id." });
  }

  // validate req.body
  const updatedProduct = req.body;

  // validate updatedProduct
  try {
    await addProductValidationSchema.validateAsync(updatedProduct);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }

  // check if product exists
  const product = await Product.findOne({ _id: productId });

  if (!product) {
    return res.status(404).send({ message: "Product does not exist." });
  }

  // check if logged in user is owner of product
  const isLoggedInUserOwnerOfProduct = loggedInUserId.equals(product.sellerId);

  if (!isLoggedInUserOwnerOfProduct) {
    return res
      .status(409)
      .send({ message: "You are not owner of this product." });
  }

  // edit product
  await Product.updateOne(
    { _id: productId },
    {
      $set: {
        name: updatedProduct.name,
        company: updatedProduct.company,
        price: updatedProduct.price,
        freeShipping: updatedProduct.freeShipping,
        quantity: updatedProduct.quantity,
        category: updatedProduct.category,
        imageUrl: updatedProduct.imageUrl,
      },
    }
  );

  return res.status(200).send({ message: "Product is updated successfully." });
};

// get latest products
export const getLatestProducts = async (req, res) => {
  const count = req.params.count;

  // validate count
  try {
    await countValidationSchema.validateAsync(count);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }

  const latestProducts = await Product.aggregate([
    { $match: {} },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $limit: +count,
    },
  ]);

  return res.status(200).send(latestProducts);
};

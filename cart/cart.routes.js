import express from "express";
import { isBuyer } from "../auth/auth.middleware.js";
import { Product } from "../product/product.entity.js";
import { Cart } from "./cart.entity.js";
import mongoose from "mongoose";
import { checkMongooseIdValidity } from "../utils/utils.js";

const router = express.Router();

// add item to cart

router.post("/cart/add/item", isBuyer, async (req, res) => {
  const { productId, quantity } = req.body;

  //   validate this data
  // check if product id is mongoid
  //   check if product with id exists
  const product = await Product.findOne({ _id: productId });

  if (!product) {
    return res.status(404).send({ message: "Product does not exist." });
  }

  if (quantity > product.quantity) {
    return res.status(403).send({ message: "Product is out of stock." });
  }

  //   add item to cart of that buyer
  const buyerId = req.loggedInUser._id;

  await Cart.updateOne(
    {
      buyerId: buyerId,
    },
    {
      $push: {
        productList: { productId, quantity },
      },
    },
    {
      upsert: true,
    }
  );

  return res
    .status(200)
    .send({ message: "Item is added to cart successfully." });
});

router.put("/cart/remove/item/:id", isBuyer, async (req, res) => {
  const userId = req.loggedInUser._id;

  const productId = req.params.id;

  // validate mongo id
  const isValidMongoId = checkMongooseIdValidity(productId);

  if (!isValidMongoId) {
    return res.status(400).send({ message: "Invalid mongo id." });
  }

  await Cart.updateOne(
    { buyerId: userId },
    {
      $pull: {
        productList: { productId: new mongoose.Types.ObjectId(productId) },
      },
    }
  );

  return res.status(200).send({ message: "Item is removed from cart." });
});

router.put("/cart/update/quantity/:id", isBuyer, async (req, res) => {
  const newQuantity = req.body.newQuantity;

  const productId = req.params.id;

  // mongo id validation and new quantity validation

  // check product existence
  const product = await Product.findOne({ _id: productId });

  if (!product) {
    return res.status(404).send({ message: "Product does not exist." });
  }

  // buyer is logged in user
  const buyerId = req.loggedInUser._id;

  await Cart.updateOne(
    {
      buyerId: buyerId,
      "productList.productId": productId,
    },
    {
      $set: {
        "productList.$.quantity": newQuantity,
      },
    }
  );

  return res.status(200).send({ message: "Cart is updated successfully." });
});

router.get("/cart/details", isBuyer, async (req, res) => {
  const loggedInUserId = req.loggedInUser._id;

  let data = await Cart.aggregate([
    {
      $match: { buyerId: loggedInUserId },
    },
    {
      $unwind: "$productList",
    },
    {
      $lookup: {
        from: "products",
        localField: "productList.productId",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    {
      $project: {
        name: { $first: "$productDetails.name" },
        company: { $first: "$productDetails.company" },
        unitPrice: { $first: "$productDetails.price" },
        availableQuantity: { $first: "$productDetails.quantity" },
        orderQuantity: "$productList.quantity",
        productId: { $first: "$productDetails._id" },
      },
    },
  ]);

  data = data.map((item) => {
    const totalPrice = item.unitPrice * item.orderQuantity;

    return { ...item, totalPrice };
  });

  return res.status(200).send(data);
});

export default router;

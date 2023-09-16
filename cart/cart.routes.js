import express from "express";
import { isBuyer } from "../auth/auth.middleware.js";
import { Product } from "../product/product.entity.js";
import { Cart } from "./cart.entity.js";
import mongoose from "mongoose";
import { checkMongooseIdValidity } from "../utils/utils.js";
import {
  actionValidationSchema,
  quantityValidationSchema,
} from "./cart.validation.js";

const router = express.Router();

// add item to cart

router.post("/cart/add/item", isBuyer, async (req, res) => {
  const { productId, quantity } = req.body;

  //   validate this data => quantity
  try {
    await quantityValidationSchema.validateAsync({ quantity });
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }
  // check if product id is mongoid
  const isValidMongoId = checkMongooseIdValidity(productId);

  if (!isValidMongoId) {
    return res.status(400).send({ message: "Invalid mongo id." });
  }
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

  // check if user cart has that product already
  const cartHasProduct = await Cart.findOne({
    buyerId: buyerId,
    "productList.productId": productId,
  });

  if (cartHasProduct) {
    await Cart.updateOne(
      {
        buyerId: buyerId,
        "productList.productId": productId,
      },
      {
        $inc: { "productList.$.quantity": quantity },
      }
    );
  } else {
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
  }

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
  const body = req.body;

  const productId = req.params.id;

  try {
    await actionValidationSchema.validateAsync(body);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }

  // validate product id
  const isValidMongoId = checkMongooseIdValidity(productId);

  if (!isValidMongoId) {
    return res.status(400).send({ message: "Invalid mongo id." });
  }

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
      $inc: {
        "productList.$.quantity": body.action === "increase" ? 1 : -1,
      },
    }
  );

  return res.status(200).send({ message: "Cart is updated successfully." });
});

router.get("/cart/details", isBuyer, async (req, res) => {
  const loggedInUserId = req.loggedInUser._id;

  let cartList = await Cart.aggregate([
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
        imageUrl:{$first:"$productDetails.imageUrl"}
      },
    },
  ]);

  cartList = cartList.map((item) => {
    const totalPrice = item.unitPrice * item.orderQuantity;

    return { ...item, totalPrice };
  });

  console.log(cartList)

  let subTotal = 0;
  cartList.forEach((item) => {
    subTotal += item.totalPrice;
  });

  // give five percent flat discount
  const grandTotal = 0.95 * subTotal;

  return res.status(200).send({ cartList, grandTotal, subTotal });
});

router.get("/cart/count", isBuyer, async (req, res) => {
  const loggedInUserId = req.loggedInUser._id;
  let itemCount = 0;

  const cart = await Cart.findOne({ buyerId: loggedInUserId });

  if (!cart) {
    itemCount = 0;
  } else {
    itemCount = cart?.productList?.length;
  }

  return res.status(200).send({ itemCount });
});
export default router;

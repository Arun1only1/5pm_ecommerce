import mongoose from "mongoose";

// set rule
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 2,
    maxlength: 55,
    trim: true,
    required: true,
  },
  company: {
    type: String,
    minlength: 2,
    maxlength: 55,
    trim: true,
    required: true,
  },
  price: {
    type: Number,
    min: 0,
    required: true,
  },
  freeShipping: {
    type: Boolean,
    default: false,
  },
  quantity: {
    type: Number,
    min: 0,
    required: true,
  },
  color: {
    type: [String],
    required: false,
  },
  inStock: {
    type: Boolean,
    default: true,
  },
  sellerId: {
    type: mongoose.ObjectId, //mongoose.Schema.Types.ObjectId
    ref: "User",
  },

  categoryId: {
    type: mongoose.ObjectId,
    ref: "Category",
  },
});

// create table
export const Product = mongoose.model(Product, productSchema);

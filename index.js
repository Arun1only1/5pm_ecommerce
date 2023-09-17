import express from "express";
import { dbConnect } from "./db.connect.js";
import userRoutes from "./user/user.route.js";
import categoryRoutes from "./category/category.routes.js";
import productRoutes from "./product/product.route.js";
import cartRoutes from "./cart/cart.routes.js";

const app = express();

// to make express understand json
app.use(express.json());

// cors
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.header("Access-Control-Expose-Headers", "accessToken, refreshToken,");
    res.header(
      "Access-Control-Allow-Methods",
      "PUT, POST, PATCH, DELETE, GET, OPTIONS"
    );
    return res.status(200).json({});
  }

  return next();
});

// database connection
await dbConnect();

// register routes
app.use(userRoutes);
app.use(categoryRoutes);
app.use(productRoutes);
app.use(cartRoutes);

const port = process.env.API_PORT;

app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});

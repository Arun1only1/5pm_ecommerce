import express from "express";
import { dbConnect } from "./db.connect.js";
import userRoutes from "./user/user.route.js";

const app = express();
// to make express understand json
app.use(express.json());

// database connection
dbConnect();

// register routes
app.use(userRoutes);

const port = process.env.API_PORT;

app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});

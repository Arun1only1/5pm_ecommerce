import mongoose from "mongoose";

const dbURL = process.env.MONGO_URL;
export const dbConnect = async () => {
  try {
    await mongoose.connect(dbURL);
    console.log("DB connection : OK");
  } catch (error) {
    console.log("DB connection failed");
    console.log(error.message);
  }
};

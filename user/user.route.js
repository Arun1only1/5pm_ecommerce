import express from "express";
import { registerUser, loginUser } from "./user.service.js";

// router
const router = express.Router();

// register user
router.post("/user/register", registerUser);

// login user
router.get("/user/login", loginUser);

export default router;

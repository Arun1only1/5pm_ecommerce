import express from "express";
import { registerUser, loginUser } from "./user.service.js";

// router
const router = express.Router();

// register user
router.post("/user/register", registerUser);

// login user
// !if we have body in req.. then it cannot be get request
router.post("/user/login", loginUser);

export default router;

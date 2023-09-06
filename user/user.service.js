import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "./user.entity.js";
import {
  loginValidationSchema,
  userValidationSchema,
} from "./user.validation.js";
import { Cart } from "../cart/cart.entity.js";

// register user
export const registerUser = async (req, res) => {
  // get new user from body
  let newUser = req.body;

  // validate data
  try {
    await userValidationSchema.validateAsync(newUser);
  } catch (error) {
    // terminate
    return res.status(400).send({ message: error.message });
  }

  // check if user with provided email already exist
  const user = await User.findOne({ email: newUser.email });

  // if user is already exist, throw error
  if (user) {
    return res
      .status(409)
      .send({ message: "User with this email already exists in our system." });
  }

  // password => hash using bcrypt
  const hashedPassword = await bcrypt.hash(newUser.password, 8);

  //   replace password with hashed password
  newUser.password = hashedPassword;

  //   create user
  await User.create(newUser);

  return res.status(201).send({ message: "User registered successfully." });
};

// login user
export const loginUser = async (req, res) => {
  // extract email and password from request body
  const loginCredentials = req.body;

  // validate data
  try {
    await loginValidationSchema.validateAsync(loginCredentials);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }

  // find user with email
  const user = await User.findOne({ email: loginCredentials.email });

  // if not user, throw error
  if (!user) {
    return res.status(404).send({ message: "Invalid credentials." });
  }

  // compare password from req.body with hashed password in database
  const passwordMatch = await bcrypt.compare(
    loginCredentials.password, //plain password
    user.password //hashed password
  );

  //   if not password match, throw error
  if (!passwordMatch) {
    return res.status(404).send({ message: "Invalid credentials." });
  }

  // generate access token
  const access_token = jwt.sign(
    { email: user.email },
    process.env.JWT_ACCESS_TOKEN_SECRET,
    {
      expiresIn: "1d",
    }
  );

  //   remove password from user object
  user.password = undefined;

  //  send appropriate response
  return res.status(200).send({
    user,
    access_token,
  });
};

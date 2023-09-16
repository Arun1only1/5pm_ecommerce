import Joi from "joi";

export const quantityValidationSchema = Joi.object({
  quantity: Joi.number().required().min(1),
});

export const actionValidationSchema = Joi.object({
  action: Joi.string().required().valid("increase", "decrease"),
});

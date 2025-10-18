import { body } from "express-validator";
import { User } from "../../models/driver/userModel.js";

// ✅ Create driver validations
export const createDriverValidator = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email")
    .isEmail().withMessage("Valid email is required")
    .custom(async (value) => {
      const existing = await User.findOne({ email: value });
      if (existing) throw new Error("Email already exists");
      return true;
    }),
  body("phone")
    .isMobilePhone().withMessage("Valid phone number is required")
    .custom(async (value) => {
      const existing = await User.findOne({ phone: value });
      if (existing) throw new Error("Phone already exists");
      return true;
    }),
  body("country").notEmpty().withMessage("Country is required"),
  body("role").isIn(["driver", "manager", "admin"]).withMessage("Invalid role"),
  body("policies").notEmpty().withMessage("Policies are required"),
];

// ✅ Update driver validations
export const updateDriverValidator = [
  body("details.internalId").optional().isString(),
  body("details.licenceNumber").optional().isString(),
  body("details.vendor").optional().isString(),
  body("details.city").optional().isString(),
  body("details.country").optional().isString(),
  body("details.status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Invalid status"),
  body("location.longitude").optional().isString(),
  body("location.latitude").optional().isString(),
];

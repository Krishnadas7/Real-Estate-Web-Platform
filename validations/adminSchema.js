import Joi from 'joi'

export const adminLoginSchema = Joi.object({
    email: Joi.string()
    .email({ tlds: { allow: false } }) // disables TLD check like '.com'
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Invalid email format',
    }),
    password: Joi.string()
    .min(6)
    .max(30)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters',
      'string.max': 'Password must be at most 30 characters',
    }),
})


export const adminRegisterSchmea = Joi.object({
  firstName: Joi.string()
    .min(2)
    .max(30)
    .required()
    .messages({
      'string.empty': 'First name is required',
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name must be at most 30 characters',
    }),

  lastName: Joi.string()
    .min(1)
    .max(30)
    .required()
    .messages({
      'string.empty': 'Last name is required',
    }),

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Invalid email format',
    }),

  password: Joi.string()
    .min(6)
    .max(30)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters',
    }),
});

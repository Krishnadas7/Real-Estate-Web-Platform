import Joi from 'joi'

export const clientRegisterSchma = Joi.object({
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
  
    company: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.empty': 'Company is required',
      }),
  
    mobile: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .required()
      .messages({
        'string.empty': 'Mobile number is required',
        'string.pattern.base': 'Mobile number must be 10 digits',
      }),
  
    agentTask: Joi.string()
      .min(3)
      .max(100)
      .required()
      .messages({
        'string.empty': 'Agent task is required',
        'string.min': 'Agent task must be at least 3 characters',
      }),
  });

export const clientBasicSchmema = Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Invalid email format',
      }),
  
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
  
    company: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.empty': 'Company is required',
      }),
  
    mobile: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .required()
      .messages({
        'string.empty': 'Mobile number is required',
        'string.pattern.base': 'Mobile number must be exactly 10 digits',
      }),
  
    address: Joi.string()
      .min(5)
      .max(100)
      .required()
      .messages({
        'string.empty': 'Address is required',
        'string.min': 'Address must be at least 5 characters',
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

export const  otpSchema = Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Invalid email format',
      }),
  
    enteredOTP: Joi.string()
      .pattern(/^[0-9]{6}$/)
      .required()
      .messages({
        'string.empty': 'OTP is required',
        'string.pattern.base': 'OTP must be exactly 6 digits',
      }),
  });  

export const clinetLoginSchema = Joi.object({
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

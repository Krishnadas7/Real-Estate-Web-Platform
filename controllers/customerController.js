import { User } from "../models/driver/userModel.js";

// Create Customer
export const createCustomer = async (req, res) => {
  try {
    const {name,email,phone,country,city,state,internalId} = req.body
    const customer = new User({
      name,
      email,
      phone,
      country,
      state,
      city,
      internalId,
      joinDate:new Date(),
      role:'customer'
    });
    const savedCustomer = await customer.save();
    res.status(201).json({ success: true,message:"customer created", data: savedCustomer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Customer (only provided fields)
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCustomer = await User.findByIdAndUpdate(
      id,
      { $set: req.body }, // only update shared fields
      { new: true, runValidators: true }
    );
    if (!updatedCustomer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    res.status(200).json({ success: true, data: updatedCustomer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete Customer
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCustomer = await User.findByIdAndDelete(id);
    if (!deletedCustomer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    res.status(200).json({ success: true, message: "Customer deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// List All Customers
export const listCustomers = async (req, res) => {
  try {
    const customers = await User.find({role:'customer'}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Search Customers (by name, email, phone, title)
export const searchCustomers = async (req, res) => {
  try {
    const { q } = req.query; // ?q=searchText
    const regex = new RegExp(q, "i"); // case-insensitive search
    const customers = await User.find({
      $or: [
        { name: regex },
        { email: regex },
        { phone: regex },
        { title: regex },
        { "placeDetails.city": regex },
        { "placeDetails.country": regex }
      ],
    });
    res.status(200).json({ success: true, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

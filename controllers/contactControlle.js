import { User } from "../models/driver/userModel.js";

// Create a contact
export const createContact = async (req, res) => {
  try {
    const {name,email,phone,country,city,state,internalId} = req.body
    const contact = new User({
      name,
      email,
      phone,
      internalId,
      country,
      city,
      status:'active',
      role:'contact',
      joinDate:new Date(),
      state
    })
    await contact.save()

    res.status(201).json({ success: true,message:"new contact is created", data: contact });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update contact (only provided fields)
export const updateContact = async (req, res) => {
  try {
    console.log('dfs');
    
    const { id } = req.params;
    const contact = await User.findOne({_id:id})
    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }
    const updatedContact = await User.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    res.json({ success: true, data: updatedContact });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete contact
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }
    res.json({ success: true, message: "Contact deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// List all contacts
export const listContacts = async (req, res) => {
  try {
    const contacts = await User.find({role:'contact'}).sort({ createdAt: -1 });
    res.json({ success: true, data: contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Search contact by name
export const searchContact = async (req, res) => {
  try {
    const { name } = req.query;
    const contacts = await User.find({
      name: { $regex: name, $options: "i" }
    });
    res.json({ success: true, data: contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

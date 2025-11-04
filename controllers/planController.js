import { Plan } from "../models/planModel.js";

// ✅ Create Plan
export const createPlan = async (req, res) => {
  try {
    const {
      planName,
      planType,
      description,
      lifetime,
      monthly,
      features,
      status = 'active',
      isDefault = false
    } = req.body;

    // If this is set as default, unset other defaults
    if (isDefault) {
      await Plan.updateMany({ isDefault: true }, { isDefault: false });
    }

    const plan = new Plan({
      planName,
      planType,
      description,
      lifetime: lifetime || {},
      monthly: monthly || {},
      features: features || [],
      status,
      isDefault
    });

    await plan.save();

    res.status(201).json({
      success: true,
      message: "Plan created successfully",
      data: plan
    });
  } catch (err) {
    console.error('Error creating plan:', err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// ✅ Get All Plans
export const getAllPlans = async (req, res) => {
  try {
    const { status, planType } = req.query;
    
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (planType && planType !== 'all') {
      filter.planType = planType;
    }

    const plans = await Plan.find(filter)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Plans retrieved successfully",
      data: plans
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// ✅ Get Plan by ID
export const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found"
      });
    }

    res.json({
      success: true,
      message: "Plan retrieved successfully",
      data: plan
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// ✅ Update Plan
export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      planName,
      planType,
      description,
      lifetime,
      monthly,
      features,
      status,
      isDefault
    } = req.body;

    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found"
      });
    }

    // If this is set as default, unset other defaults
    if (isDefault && !plan.isDefault) {
      await Plan.updateMany({ isDefault: true }, { isDefault: false });
    }

    const updateData = {};
    if (planName) updateData.planName = planName;
    if (planType) updateData.planType = planType;
    if (description !== undefined) updateData.description = description;
    if (lifetime) updateData.lifetime = lifetime;
    if (monthly) updateData.monthly = monthly;
    if (features) updateData.features = features;
    if (status) updateData.status = status;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const updatedPlan = await Plan.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    res.json({
      success: true,
      message: "Plan updated successfully",
      data: updatedPlan
    });
  } catch (err) {
    console.error('Error updating plan:', err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// ✅ Delete Plan
export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findByIdAndDelete(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found"
      });
    }

    res.json({
      success: true,
      message: "Plan deleted successfully"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};


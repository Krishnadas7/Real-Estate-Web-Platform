import { Trailer } from "../models/driver/trailerModel.js";

// ✅ Create Trailer
export const createTrailer = async (req, res) => {
  try {
    // Add company to trailer if user has company
    const trailerData = {
      ...req.body,
      ...(req.user.company && { company: req.user.company })
    };
    
    const trailer = new Trailer(trailerData);
    const savedTrailer = await trailer.save();
    res.status(201).json({
      success: true,
      message: "Trailer created successfully",
      data: savedTrailer
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// ✅ Get Trailer by ID
export const getTrailerById = async (req, res) => {
  try {
    const { id } = req.params;
    const trailer = await Trailer.findById(id)
      .populate('attachedVehicle', 'plateNumber make model driver')
      .populate('attachedVehicle.driver', 'name');
    
    if (!trailer) {
      return res.status(404).json({
        success: false,
        message: "Trailer not found"
      });
    }
    
    res.json({
      success: true,
      message: "Trailer retrieved successfully",
      data: trailer
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// ✅ Update Trailer
export const updateTrailer = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTrailer = await Trailer.findByIdAndUpdate(
      id, 
      req.body, 
      {
        new: true,
        runValidators: true,
      }
    );
    
    if (!updatedTrailer) {
      return res.status(404).json({
        success: false,
        message: "Trailer not found"
      });
    }
    
    res.json({
      success: true,
      message: "Trailer updated successfully",
      data: updatedTrailer
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// ✅ Delete Trailer
export const deleteTrailer = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTrailer = await Trailer.findByIdAndDelete(id);
    
    if (!deletedTrailer) {
      return res.status(404).json({
        success: false,
        message: "Trailer not found"
      });
    }
    
    res.json({
      success: true,
      message: "Trailer deleted successfully",
      data: deletedTrailer
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// ✅ Get All Trailers with filtering and pagination
export const getAllTrailers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      status,
      operationStatus,
      isAttached,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filters = {};
    
    // Company filter
    if (req.user.company) {
      filters.company = req.user.company;
    }
    
    // Search filter
    if (search) {
      filters.$or = [
        { trailer: { $regex: search, $options: 'i' } },
        { plateNumber: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Other filters
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (operationStatus) filters.operationStatus = operationStatus;
    if (isAttached !== undefined) filters.isAttached = isAttached === 'true';

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const trailers = await Trailer.find(filters)
      .populate('attachedVehicle', 'plateNumber make model driver')
      .populate('attachedVehicle.driver', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Trailer.countDocuments(filters);

    res.json({
      success: true,
      message: "Trailers retrieved successfully",
      data: trailers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// ✅ Search Trailers
export const searchTrailers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    const filters = {
      $or: [
        { trailer: { $regex: q, $options: 'i' } },
        { plateNumber: { $regex: q, $options: 'i' } },
        { type: { $regex: q, $options: 'i' } }
      ]
    };

    // Add company filter if user has company
    if (req.user.company) {
      filters.company = req.user.company;
    }

    const trailers = await Trailer.find(filters)
      .populate('attachedVehicle', 'plateNumber make model')
      .limit(20);

    res.json({
      success: true,
      message: "Search completed",
      data: trailers
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// ✅ Get Trailer Statistics
export const getTrailerStats = async (req, res) => {
  try {
    const companyFilter = req.user.company ? { company: req.user.company } : {};

    const total = await Trailer.countDocuments(companyFilter);
    const inTransit = await Trailer.countDocuments({ ...companyFilter, operationStatus: 'in_transit' });
    const loading = await Trailer.countDocuments({ ...companyFilter, operationStatus: 'loading' });
    const idle = await Trailer.countDocuments({ ...companyFilter, operationStatus: 'idle' });
    const maintenance = await Trailer.countDocuments({ ...companyFilter, operationStatus: 'maintenance' });
    const available = await Trailer.countDocuments({ ...companyFilter, operationStatus: 'available' });
    const attached = await Trailer.countDocuments({ ...companyFilter, isAttached: true });

    res.json({
      success: true,
      message: "Trailer statistics retrieved",
      data: {
        total,
        inTransit,
        loading,
        idle,
        maintenance,
        available,
        attached,
        unattached: total - attached
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// ✅ Update Trailer Status
export const updateTrailerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { operationStatus, status } = req.body;

    const updateData = {};
    if (operationStatus) updateData.operationStatus = operationStatus;
    if (status) updateData.status = status;

    const updatedTrailer = await Trailer.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTrailer) {
      return res.status(404).json({
        success: false,
        message: "Trailer not found"
      });
    }

    res.json({
      success: true,
      message: "Trailer status updated successfully",
      data: updatedTrailer
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// ✅ Legacy function - kept for backward compatibility
export const selectedTrailor = async (req, res) => {
  try {
    const trailerId = req.query.trailerId;
    console.log(trailerId);
    
    const trailer = await Trailer.findOne({ _id: trailerId });
    return res.json({
      success: true,
      message: "Selected trailer",
      data: trailer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

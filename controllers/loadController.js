import { validationResult } from "express-validator";
import Load from "../models/loadModel.js";
import { User } from "../models/driver/userModel.js";
import ActivityLog from "../models/activitylogModel.js";
import Admin from "../models/adminModel.js";
import axios from "axios";
import { Shift } from "../models/driver/shiftModel.js";

export const totalLoadsCount = async (req,res) =>{
  try {
      const totalLoadsCount = await Load.countDocuments()
      return res.json({success:true,message:"total loads",data:totalLoadsCount})
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching completed loads",
      error: err.message
    });
  }
}
// ✅ Aggregation: Get Completed Loads for a Driver
export const getCompletedLoadsByDriver = async (req, res) => {
  try {
    const driverId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(driverId)) {
      return res.status(400).json({ success: false, message: "Invalid driver ID" });
    }

    const completedLoads = await Load.aggregate([
      {
        $match: {
          "details.driver": new mongoose.Types.ObjectId(driverId),
          status: "completed"
        }
      },
      // ✅ Join driver info
      {
        $lookup: {
          from: "users",
          localField: "details.driver",
          foreignField: "_id",
          as: "driverDetails"
        }
      },
      { $unwind: "$driverDetails" },

      // ✅ Join customer info
      {
        $lookup: {
          from: "users",
          localField: "details.customer",
          foreignField: "_id",
          as: "customerDetails"
        }
      },
      { $unwind: { path: "$customerDetails", preserveNullAndEmptyArrays: true } },

      // ✅ Join facilitator info
      {
        $lookup: {
          from: "facilators",
          localField: "details.facilator",
          foreignField: "_id",
          as: "facilatorDetails"
        }
      },
      { $unwind: { path: "$facilatorDetails", preserveNullAndEmptyArrays: true } },

      // ✅ Choose only the fields you need
      {
        $project: {
          status: 1,
          assignedAt: 1,
          startedAt: 1,
          completedAt: 1,
          "route.selectPickup": 1,
          "route.selectDropOff": 1,
          "payloads.itemName": 1,
          "payloads.measurementAndWeight": 1,

          "driverDetails._id": 1,
          "driverDetails.name": 1,
          "driverDetails.phone": 1,

          "customerDetails._id": 1,
          "customerDetails.name": 1,
          "customerDetails.email": 1,

          "facilatorDetails._id": 1,
          "facilatorDetails.name": 1,
          "facilatorDetails.email": 1
        }
      }
    ]);

    res.json({
      success: true,
      message: "Completed loads fetched successfully",
      data: completedLoads
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching completed loads",
      error: err.message
    });
  }
};

// helper fn: fetch lat/lng for address
const getCoordinates = async (address) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY; // set in .env
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${apiKey}`;

    const response = await axios.get(url);

    if (
      response.data.status === "OK" &&
      response.data.results &&
      response.data.results.length > 0
    ) {
      const location = response.data.results[0].geometry.location;
      return {
        place: address,
        longitude: location.lng.toString(),
        latitude: location.lat.toString(),
      };
    }
    return {
      place: address,
      longitude: "",
      latitude: "",
    };
  } catch (err) {
    console.error("Error fetching coordinates:", err.message);
    return {
      place: address,
      longitude: "",
      latitude: "",
    };
  }
};

export const createLoad = async (req, res) => {
  try {
    const { details, route, payloads, services, notes, status } = req.body;

    // ✅ Parse JSON strings (because form-data sends them as strings)
    let parsedDetails = details ? JSON.parse(details) : {};
    let parsedRoute = route ? JSON.parse(route) : {};
    let parsedPayloads = payloads ? JSON.parse(payloads) : [];
    let parsedServices = services ? JSON.parse(services) : [];

    // ✅ Handle uploaded documents
    let documentUrls = [];
    if (req.files && req.files.documents) {
      documentUrls = req.files.documents.map((file) =>
        process.env.NODE_ENV === "production"
          ? file.location // if using S3
          : `${req.protocol}://${req.get("host")}/${file.path}` // local uploads
      );
    }

    // ✅ find driver/admin for activity log
    const driverId = parsedDetails?.driver;
    const driver = driverId ? await User.findOne({ _id: driverId }) : null;
    const driverName = driver?.name || "";

    const adminId = req.admin?.id;
    const admin = adminId ? await User.findOne({ _id: adminId }) : null;
    const adminName = admin?.name || "";

    if (adminId && driverId) {
      await ActivityLog.create({
        performedBy: adminId,
        action: `Load assigned`,
        driver: driverId,
        changeSummary: `Hi ${driverName} you got a load from ${adminName}`,
      });
    }

    // ✅ prepare route object
    let processedRoute = {};
    if (parsedRoute?.multipleDropOffs) {
      const wayPointsWithCoords = await Promise.all(
        (parsedRoute.wayPoints || []).map(async (wp) => {
          const coords = await getCoordinates(wp.address);
          return {
            address: coords,
            customer: wp.customer || null,
            dropOff: wp.dropOff || false,
            pickup: wp.pickup || false,
          };
        })
      );

      processedRoute = {
        multipleDropOffs: true,
        wayPoints: wayPointsWithCoords,
        selectReturn: parsedRoute.selectReturn || null,
      };
    } else if (parsedRoute) {
      const pickupCoords = await getCoordinates(parsedRoute.selectPickup);
      const dropOffCoords = await getCoordinates(parsedRoute.selectDropOff);

      processedRoute = {
        multipleDropOffs: false,
        selectPickup: pickupCoords,
        selectDropOff: dropOffCoords,
        selectReturn: parsedRoute.selectReturn || null,
      };
    }

    // ✅ Save load
    const load = new Load({
      details: parsedDetails,
      route: processedRoute,
      payloads: parsedPayloads,
      services: parsedServices,
      notes,
      documents: documentUrls.map((url) => ({ documentUrl: url })),
      status,
    });

    await load.save();

    // ✅ ALSO create a Shift for the driver if assigned
    if (driverId) {
      await Shift.create({
        driver: driverId,
        vehicle: parsedDetails?.vehicle || null,
        load: load._id,
        shiftDate: load?.assignedAt, // or you can use load.assignedAt
        startTime: new Date(), // for now using current, can map from load
        endTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // default 4 hrs later
        status: "scheduled",
        notes: `Auto-created shift for Load ${load._id}`,
      });
    }

    res.status(201).json({
      success: true,
      message: "Load created successfully",
      load,
    });
  } catch (error) {
    console.error("Create Load Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// update load status (pending → active → completed)
export const updateLoadStatus = async (req, res) => {
  try {
    const { loadId, status } = req.body; 

    // validate allowed statuses
    const allowedStatuses = ["pending", "active", "completed"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    // find the load
    const load = await Load.findById(loadId);
    if (!load) {
      return res.status(404).json({ success: false, message: "Load not found" });
    }

    // update timestamps based on status
    if (status === "active" && load.status === "pending") {
      load.status = "active";
      load.startedAt = new Date();
    } else if (status === "completed" && load.status === "active") {
      load.status = "completed";
      load.completedAt = new Date();
    } else {
      return res.status(400).json({
        success: false,
        message: `Cannot move from ${load.status} to ${status}`,
      });
    }

    await load.save();

    res.json({
      success: true,
      message: `Load updated to ${status}`,
      data: load,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// === Active Loads ===
export const activeLoads = async (req, res) => {
  try {
    const driverId = req.driver._id

    const loads = await Load.aggregate([
      { $match: { "details.driver": driverId, status: "active" } },
      {
        $lookup: {
          from: "users",
          localField: "details.customer",
          foreignField: "_id",
          as: "customer"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "details.driver",
          foreignField: "_id",
          as: "driver"
        }
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id:1,
          orderType: "$details.orderType",
          internalId: "$details.internaleId",
          status: 1,
          driver: 1,
          route:1,
          payloads: {
            itemName: 1,
            description: 1,
            "measurementAndWeight.weight": 1,
            itemImageUrl: 1
          },
          requiredProof: "$details.requiredProof",
          notes: 1,
          documents: 1,
          customer: { name: "$customer.name", email: "$customer.email" }
        }
      }
    ])

    return res.status(200).json({ success: true, count: loads.length, loads })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: "Server error" })
  }
}

// === Pending Loads (example: active but not yet started) ===
export const pendingLoads = async (req, res) => {
  try {
    const driverId = req.driver._id

    const loads = await Load.aggregate([
      { $match: { "details.driver": driverId, status: "pending" } }, // business logic: pending == active
      {
        $lookup: {
          from: "users",
          localField: "details.customer",
          foreignField: "_id",
          as: "customer"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "details.driver",
          foreignField: "_id",
          as: "driver"
        }
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id:1,
          orderType: "$details.orderType",
          internalId: "$details.internaleId",
          status: 1,
          driver: 1,
          route:1,
          payloads: {
            itemName: 1,
            description: 1,
            "measurementAndWeight.weight": 1,
            itemImageUrl: 1
          },
          requiredProof: "$details.requiredProof",
          notes: 1,
          documents: 1,
          customer: { name: "$customer.name", email: "$customer.email" }
        }
      }
    ])

    return res.status(200).json({ success: true, count: loads.length, loads })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" })
  }
}

// === Started Loads ===
export const startedLoads = async (req, res) => {
  try {
    const driverId = req.driver._id

    const loads = await Load.aggregate([
      { $match: { "details.driver": driverId, status: "started" } },
      {
        $project: {
          orderType: "$details.orderType",
          internalId: "$details.internaleId",
          status: 1,
          pickup: "$route.selectPickup",
          dropOff: "$route.selectDropOff"
        }
      }
    ])

    return res.status(200).json({ success: true, count: loads.length, loads })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" })
  }
}

// === Delivered Loads ===
export const deliveredLoads = async (req, res) => {
  try {
    const driverId = req.driver._id

    const loads = await Load.aggregate([
      { $match: { "details.driver": driverId, status: "completed" } },
      {
        $lookup: {
          from: "users",
          localField: "details.customer",
          foreignField: "_id",
          as: "customer"
        }
      },
      {
        $lookup: {
          from: "driver",
          localField: "details.driver",
          foreignField: "_id",
          as: "driver"
        }
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id:1,
          orderType: "$details.orderType",
          internalId: "$details.internaleId",
          status: 1,
          driver: 1,
          route:1,
          payloads: {
            itemName: 1,
            description: 1,
            "measurementAndWeight.weight": 1,
            itemImageUrl: 1
          },
          requiredProof: "$details.requiredProof",
          notes: 1,
          documents: 1,
          customer: { name: "$customer.name", email: "$customer.email" }
        }
      }
    ])

    return res.status(200).json({ success: true, count: loads.length, loads })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" })
  }
}



export const getAllLoads = async (req, res) => {
  try {
    const loads = await Load.find()
      .populate("details.customer", "name") // only fetch customer name
      .populate("details.driver", "name")   // only fetch driver name
      .populate("route.wayPoints.customer", "name"); // if waypoints need customer name

    const formattedLoads = loads.map((load) => ({
      orderId: load._id,
      driverName: load.details?.driver?.name || null,
      customerName: load.details?.customer?.name || null,
      route: load.route || [],
      status: load.status || null,
      notes: load.notes || null,
      assignedAt: load.assignedAt || null,
    }));
    res.json({
      success: true,
      count: formattedLoads.length,
      data: formattedLoads,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ✅ Get Single Load by ID
export const getLoadById = async (req, res) => {
  try {
    const load = await Load.findById(req.params.id)
      .populate("details.customer")
      .populate("details.facilator")
      .populate("details.driver")
      .populate("route.wayPoints.customer");

    if (!load) {
      return res
        .status(404)
        .json({ success: false, message: "Load not found" });
    }

    res.json({ success: true, load });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update Load
export const updateLoad = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const load = await Load.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!load) {
      return res
        .status(404)
        .json({ success: false, message: "Load not found" });
    }

    res.json({ success: true, message: "Load updated successfully", load });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete Load
export const deleteLoad = async (req, res) => {
  try {
    const load = await Load.findByIdAndDelete(req.params.id);

    if (!load) {
      return res
        .status(404)
        .json({ success: false, message: "Load not found" });
    }

    res.json({ success: true, message: "Load deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

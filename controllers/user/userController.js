import { User } from "../../models/driver/userModel.js";
import { hashPassword, comparePassword } from "../../services/bcrypt.js";
import { getCoordinatesFromAddress } from "../../services/googlemap.js";

// ✅ Get Current User Profile (for all roles)
export const getCurrentUserProfile = async (req, res) => {
  try {
    // req.user is already populated by authMiddleware
    const user = await User.findById(req.user._id)
      .select("-password") // Exclude password
      .populate("company", "companyName companyCode address contactEmail contactPhone logoUrl") // Populate company if exists
      .populate("details.vehicle", "internalId plateNumber make model"); // Populate vehicle if driver

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "User profile fetched successfully",
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update Current User Profile
export const updateCurrentUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body;

    // Don't allow role/company changes from profile update
    delete updates.role;
    delete updates.company;

    // Don't allow password change here (use change password endpoint)
    delete updates.password;

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Change Current User Password (for all roles)
export const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "New password is required" 
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Use updateOne to avoid triggering full document validation
    await User.updateOne(
      { _id: userId },
      { $set: { password: hashedPassword } }
    );

    res.status(200).json({ 
      success: true, 
      message: "Password changed successfully" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error changing password", 
      error: error.message 
    });
  }
};

 export const   getAllFaciliators = async (req,res) =>{
   try {
     const faci = await User.find({role:'faciliator'})

    res.json({ success: true, data:faci });
  } catch (err) {
    res.status(500).json({success:false,message:err.message });
  }
 }
export const getEmployees = async (req, res) => {
  try {
    const { role } = req.query;

    let query = {};
    if (role) {
      query.role = role; // apply filter if role is provided
    }

    const employees = await User.find(query).select(
      "name role phone status email details.mileRate internalId"
    );

    res.json({ success: true, data:employees });
  } catch (err) {
    res.status(500).json({success:false,message:err.message });
  }
};
// Create User
export const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      company,
      status = 'active',
      phone,
      password,
      role,
      country,
      state,
      city,
      policies,
      address,
      joinDate,
      internalId,
      // Driver-specific fields
      incorporation,
      employeeCode,
      postalCode,
      fleet,
      citizenship,
      paymentMethod,
      account,
      wsib,
      wsibAccountNo,
      expiryDate,
      remark,
      gstNo,
      profileImage,
      companyFlag,
      cell1,
      cell2,
      extension,
      fax,
      gender,
      dateOfBirth,
      hireDate,
      termDate,
      csa,
      fastCardNo,
      fastCardExpiry,
      medicalRequired,
      defaultChargeName,
      defaultCurrency,
      chargesAppliedOn,
      defaultMode,
      defaultAmount,
      defaultRemarks,
      defaultPayrollType,
      paymentCurrency,
      mileRate,
      mileRateTeam,
      emptyMileRate,
      emptyMileRateTeam,
      hourlyRate,
      weightRate,
      percentageRate,
      localTaxNo,
      federalTaxNo,
      sinNo,
      craAccountNo,
      fedTaxExempt,
      provTaxExempt,
      cppQppExempt,
      eiExempt,
      qpipExempt,
      payPeriod,
      vacationPay,
      ltl,
      onSettlements,
      settlementCurrencyByOrder,
      isDefault
    } = req.body;

    // Check if email already exists
    const exist = await User.findOne({ email });
    if (exist) {
      return res.status(400).json({
        success: false,
        message: "User with email already exists"
      });
    }

    // Get coordinates from address
    let coordinates = { latitude: null, longitude: null };
    if (address) {
      coordinates = await getCoordinatesFromAddress(address);
    }

    // Hash password
    const hp = await hashPassword(password);

    // Build user data
    const userData = {
      name,
      email,
      phone: phone || cell1 || cell2,
      password: hp,
      role,
      joinDate: joinDate ? new Date(joinDate) : new Date(),
      status,
      country,
      state,
      city,
      company: company || req.user?.company || '68d1418aa24e3ad6923b83e9',
      policies,
      internalId,
      location: {
        address,
        longitude: coordinates.longitude,
        latitude: coordinates.latitude
      }
    };

    // Add driver-specific details if role is driver
    if (role === 'driver') {
      userData.details = {
        incorporation,
        employeeCode: employeeCode || internalId,
        postalCode,
        fleet,
        citizenship,
        paymentMethod,
        account,
        wsib: wsib || false,
        wsibAccountNo,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        remark,
        gstNo,
        profileImage,
        companyFlag: companyFlag || false,
        cell1,
        cell2,
        extension,
        fax,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        hireDate: hireDate ? new Date(hireDate) : (joinDate ? new Date(joinDate) : undefined),
        termDate: termDate ? new Date(termDate) : undefined,
        csa: csa || false,
        fastCardNo,
        fastCardExpiry: fastCardExpiry ? new Date(fastCardExpiry) : undefined,
        medicalRequired: medicalRequired || false,
        defaultChargeName,
        defaultCurrency,
        chargesAppliedOn,
        defaultMode,
        defaultAmount: defaultAmount || 0,
        defaultRemarks,
        defaultPayrollType,
        paymentCurrency,
        mileRate: mileRate || 0,
        mileRateTeam: mileRateTeam || 0,
        emptyMileRate: emptyMileRate || 0,
        emptyMileRateTeam: emptyMileRateTeam || 0,
        hourlyRate: hourlyRate || 0,
        weightRate: weightRate || 0,
        percentageRate: percentageRate || 0,
        localTaxNo,
        federalTaxNo,
        sinNo,
        craAccountNo,
        fedTaxExempt: fedTaxExempt || false,
        provTaxExempt: provTaxExempt || false,
        cppQppExempt: cppQppExempt || false,
        eiExempt: eiExempt || false,
        qpipExempt: qpipExempt || false,
        payPeriod,
        vacationPay,
        ltl: ltl || false,
        onSettlements: onSettlements || false,
        settlementCurrencyByOrder: settlementCurrencyByOrder || false,
        isDefault: isDefault || false
      };

      // Remove undefined values from details
      Object.keys(userData.details).forEach(key => {
        if (userData.details[key] === undefined || userData.details[key] === '') {
          delete userData.details[key];
        }
      });
    }

    const user = new User(userData);
    await user.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating user",
      error: error.message
    });
  }
};

// Update User
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      password,
      role,
      country,
      state,
      city,
      policies,
      address,
      status,
      joinDate,
      internalId,
      company,
      // Driver-specific fields
      incorporation,
      employeeCode,
      postalCode,
      fleet,
      citizenship,
      paymentMethod,
      account,
      wsib,
      wsibAccountNo,
      expiryDate,
      remark,
      gstNo,
      profileImage,
      companyFlag,
      cell1,
      cell2,
      extension,
      fax,
      gender,
      dateOfBirth,
      hireDate,
      termDate,
      csa,
      fastCardNo,
      fastCardExpiry,
      medicalRequired,
      defaultChargeName,
      defaultCurrency,
      chargesAppliedOn,
      defaultMode,
      defaultAmount,
      defaultRemarks,
      defaultPayrollType,
      paymentCurrency,
      mileRate,
      mileRateTeam,
      emptyMileRate,
      emptyMileRateTeam,
      hourlyRate,
      weightRate,
      percentageRate,
      localTaxNo,
      federalTaxNo,
      sinNo,
      craAccountNo,
      fedTaxExempt,
      provTaxExempt,
      cppQppExempt,
      eiExempt,
      qpipExempt,
      payPeriod,
      vacationPay,
      ltl,
      onSettlements,
      settlementCurrencyByOrder,
      isDefault
    } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: id } });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already exists for another user"
        });
      }
    }

    // Get coordinates from address if provided
    let coordinates = { latitude: null, longitude: null };
    if (address && address !== user.location?.address) {
      coordinates = await getCoordinatesFromAddress(address);
    } else if (user.location) {
      coordinates = {
        latitude: user.location.latitude,
        longitude: user.location.longitude
      };
    }

    // Hash password if provided
    let hashedPassword = user.password;
    if (password) {
      hashedPassword = await hashPassword(password);
    }

    // Prepare update data
    const updateData = {
      name,
      email,
      phone: phone || cell1 || cell2 || user.phone,
      password: hashedPassword,
      role,
      country,
      state,
      city,
      policies,
      status,
      company,
      internalId,
      joinDate: joinDate ? new Date(joinDate) : user.joinDate,
      location: {
        address: address || user.location?.address,
        longitude: coordinates.longitude,
        latitude: coordinates.latitude
      }
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Add driver-specific details if role is driver (or if updating existing driver)
    if (role === 'driver' || user.role === 'driver') {
      const existingDetails = user.details || {};
      updateData.details = {
        incorporation: incorporation !== undefined ? incorporation : existingDetails.incorporation,
        employeeCode: employeeCode !== undefined ? employeeCode : (existingDetails.employeeCode || internalId || user.internalId),
        postalCode: postalCode !== undefined ? postalCode : existingDetails.postalCode,
        fleet: fleet !== undefined ? fleet : existingDetails.fleet,
        citizenship: citizenship !== undefined ? citizenship : existingDetails.citizenship,
        paymentMethod: paymentMethod !== undefined ? paymentMethod : existingDetails.paymentMethod,
        account: account !== undefined ? account : existingDetails.account,
        wsib: wsib !== undefined ? wsib : existingDetails.wsib || false,
        wsibAccountNo: wsibAccountNo !== undefined ? wsibAccountNo : existingDetails.wsibAccountNo,
        expiryDate: expiryDate ? new Date(expiryDate) : (existingDetails.expiryDate ? new Date(existingDetails.expiryDate) : undefined),
        remark: remark !== undefined ? remark : existingDetails.remark,
        gstNo: gstNo !== undefined ? gstNo : existingDetails.gstNo,
        profileImage: profileImage !== undefined ? profileImage : existingDetails.profileImage,
        companyFlag: companyFlag !== undefined ? companyFlag : existingDetails.companyFlag || false,
        cell1: cell1 !== undefined ? cell1 : existingDetails.cell1,
        cell2: cell2 !== undefined ? cell2 : existingDetails.cell2,
        extension: extension !== undefined ? extension : existingDetails.extension,
        fax: fax !== undefined ? fax : existingDetails.fax,
        gender: gender !== undefined ? gender : existingDetails.gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : (existingDetails.dateOfBirth ? new Date(existingDetails.dateOfBirth) : undefined),
        hireDate: hireDate ? new Date(hireDate) : (existingDetails.hireDate ? new Date(existingDetails.hireDate) : (joinDate ? new Date(joinDate) : undefined)),
        termDate: termDate ? new Date(termDate) : (existingDetails.termDate ? new Date(existingDetails.termDate) : undefined),
        csa: csa !== undefined ? csa : existingDetails.csa || false,
        fastCardNo: fastCardNo !== undefined ? fastCardNo : existingDetails.fastCardNo,
        fastCardExpiry: fastCardExpiry ? new Date(fastCardExpiry) : (existingDetails.fastCardExpiry ? new Date(existingDetails.fastCardExpiry) : undefined),
        medicalRequired: medicalRequired !== undefined ? medicalRequired : existingDetails.medicalRequired || false,
        defaultChargeName: defaultChargeName !== undefined ? defaultChargeName : existingDetails.defaultChargeName,
        defaultCurrency: defaultCurrency !== undefined ? defaultCurrency : existingDetails.defaultCurrency,
        chargesAppliedOn: chargesAppliedOn !== undefined ? chargesAppliedOn : existingDetails.chargesAppliedOn,
        defaultMode: defaultMode !== undefined ? defaultMode : existingDetails.defaultMode,
        defaultAmount: defaultAmount !== undefined ? defaultAmount : (existingDetails.defaultAmount || 0),
        defaultRemarks: defaultRemarks !== undefined ? defaultRemarks : existingDetails.defaultRemarks,
        defaultPayrollType: defaultPayrollType !== undefined ? defaultPayrollType : existingDetails.defaultPayrollType,
        paymentCurrency: paymentCurrency !== undefined ? paymentCurrency : existingDetails.paymentCurrency,
        mileRate: mileRate !== undefined ? mileRate : (existingDetails.mileRate || 0),
        mileRateTeam: mileRateTeam !== undefined ? mileRateTeam : (existingDetails.mileRateTeam || 0),
        emptyMileRate: emptyMileRate !== undefined ? emptyMileRate : (existingDetails.emptyMileRate || 0),
        emptyMileRateTeam: emptyMileRateTeam !== undefined ? emptyMileRateTeam : (existingDetails.emptyMileRateTeam || 0),
        hourlyRate: hourlyRate !== undefined ? hourlyRate : (existingDetails.hourlyRate || 0),
        weightRate: weightRate !== undefined ? weightRate : (existingDetails.weightRate || 0),
        percentageRate: percentageRate !== undefined ? percentageRate : (existingDetails.percentageRate || 0),
        localTaxNo: localTaxNo !== undefined ? localTaxNo : existingDetails.localTaxNo,
        federalTaxNo: federalTaxNo !== undefined ? federalTaxNo : existingDetails.federalTaxNo,
        sinNo: sinNo !== undefined ? sinNo : existingDetails.sinNo,
        craAccountNo: craAccountNo !== undefined ? craAccountNo : existingDetails.craAccountNo,
        fedTaxExempt: fedTaxExempt !== undefined ? fedTaxExempt : existingDetails.fedTaxExempt || false,
        provTaxExempt: provTaxExempt !== undefined ? provTaxExempt : existingDetails.provTaxExempt || false,
        cppQppExempt: cppQppExempt !== undefined ? cppQppExempt : existingDetails.cppQppExempt || false,
        eiExempt: eiExempt !== undefined ? eiExempt : existingDetails.eiExempt || false,
        qpipExempt: qpipExempt !== undefined ? qpipExempt : existingDetails.qpipExempt || false,
        payPeriod: payPeriod !== undefined ? payPeriod : existingDetails.payPeriod,
        vacationPay: vacationPay !== undefined ? vacationPay : existingDetails.vacationPay,
        ltl: ltl !== undefined ? ltl : existingDetails.ltl || false,
        onSettlements: onSettlements !== undefined ? onSettlements : existingDetails.onSettlements || false,
        settlementCurrencyByOrder: settlementCurrencyByOrder !== undefined ? settlementCurrencyByOrder : existingDetails.settlementCurrencyByOrder || false,
        isDefault: isDefault !== undefined ? isDefault : existingDetails.isDefault || false
      };

      // Remove undefined values from details
      Object.keys(updateData.details).forEach(key => {
        if (updateData.details[key] === undefined || (typeof updateData.details[key] === 'string' && updateData.details[key] === '')) {
          delete updateData.details[key];
        }
      });
    }

    // Use updateOne to avoid full document validation issues
    await User.updateOne(
      { _id: id },
      { $set: updateData }
    );

    // Fetch updated user
    const updatedUser = await User.findById(id)
      .populate('company', 'name')
      .populate('details.vehicle', 'plateNumber make model')
      .select('-password');

    res.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message
    });
  }
};

export const deleteUser = async (req, res) => {
  console.log(req.params.id);
  try {
    
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const user = await User.findOneAndDelete({ _id: id }); // Ensure correct query format
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error); // Use console.error for better visibility
    res.status(500).json({ success: false, message: "Error deleting user", error: error.message });
  }
};

// Change User Status
export const changeUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "active" or "inactive"

    const user = await User.findById(id);
    if (!user) return res.status(404).json({success:false, message: "User not found" });

    user.status = status;
    await user.save();

    res.json({success:true, message: "User status updated", user });
  } catch (error) {
    res.status(500).json({success:false, message: "Error updating status", error: error.message });
  }
};

export const listUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;

    // Build filter object dynamically
    const filter = {};
    if (role && role !== 'all') filter.role = role;
    if (status && status !== 'all') filter.status = status;

    if (search && typeof search === 'string') {
      // Case-insensitive search by name, email, phone, or internalId
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { internalId: { $regex: search, $options: 'i' } },
      ];
    }

    // Populate driver-specific fields and company, similar to getAllEmployees
    const users = await User.find(filter)
      .populate('company', 'name')
      .populate('details.vehicle', 'plateNumber make model')
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: users, message: 'Listing users' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users', error: error.message });
  }
};

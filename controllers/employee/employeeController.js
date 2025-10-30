import { User } from "../../models/driver/userModel.js";
import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import { getCoordinatesFromAddress } from "../../services/googlemap.js";

// ✅ CREATE EMPLOYEE
export const createEmployee = async (req, res) => {
    try {
        console.log('🔄 Creating employee with data:', req.body);
        
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array()
            });
        }

        const {
            name,
            email,
            phone,
            country,
            password,
            role,
            policies,
            state,
            city,
            joinDate,
            internalId,
            address,
            status = 'active',
            company
        } = req.body;

        // Check if employee already exists
        const existingEmployee = await User.findOne({ email });
        if (existingEmployee) {
            return res.status(400).json({
                success: false,
                message: "Employee with this email already exists"
            });
        }

        // Hash the provided password or use default
        const userPassword = password || "Employee@123";
        const hashedPassword = await bcrypt.hash(userPassword, 12);

        // Get coordinates from address if provided
        let coordinates = { latitude: null, longitude: null };
        if (address) {
            console.log('🗺️ Getting coordinates for address:', address);
            coordinates = await getCoordinatesFromAddress(address);
            console.log('📍 Coordinates received:', coordinates);
        }

        // Create new employee
        const employeeData = {
            name,
            email,
            phone,
            country,
            state,
            city,
            role,
            policies,
            joinDate: joinDate || new Date(),
            status,
            company,
            internalId,
            password: hashedPassword,
            location: {
                address,
                longitude: coordinates.longitude,
                latitude: coordinates.latitude
            }
        };

        const employee = new User(employeeData);
        await employee.save();

        console.log('✅ Employee created successfully:', employee._id);

        res.status(201).json({
            success: true,
            message: "Employee created successfully",
            data: {
                _id: employee._id,
                name: employee.name,
                email: employee.email,
                phone: employee.phone,
                country: employee.country,
                state: employee.state,
                city: employee.city,
                role: employee.role,
                policies: employee.policies,
                status: employee.status,
                joinDate: employee.joinDate,
                internalId: employee.internalId,
                location: employee.location
            }
        });

    } catch (error) {
        console.error('❌ Error creating employee:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// ✅ GET ALL EMPLOYEES WITH FILTERS
export const getAllEmployees = async (req, res) => {
    try {
        console.log('🔄 Fetching employees with filters:', req.query);
        
        const {
            page = 1,
            limit = 10,
            search,
            role,
            status,
            company,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = {};
        
        // Exclude admin, superadmin, and driver roles from employee listing
        filter.role = { $nin: ['admin', 'superadmin', 'driver'] };
        
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { internalId: { $regex: search, $options: 'i' } }
            ];
        }

        if (role) {
            // Only allow filtering by non-excluded roles
            if (!['admin', 'superadmin', 'driver'].includes(role)) {
                filter.role = role;
            }
        }

        if (status) {
            filter.status = status;
        }

        if (company) {
            filter.company = company;
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute query
        const employees = await User.find(filter)
            .populate('company', 'name')
            .populate('details.vehicle', 'plateNumber make model')
            .select('-password')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const totalEmployees = await User.countDocuments(filter);
        const totalPages = Math.ceil(totalEmployees / parseInt(limit));

        console.log(`✅ Found ${employees.length} employees out of ${totalEmployees} total`);

        res.status(200).json({
            success: true,
            message: "Employees fetched successfully",
            data: employees,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalEmployees,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }
        });

    } catch (error) {
        console.error('❌ Error fetching employees:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// ✅ GET EMPLOYEE BY ID
export const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔄 Fetching employee by ID:', id);

        const employee = await User.findById(id)
            .populate('company', 'name')
            .populate('details.vehicle', 'plateNumber make model')
            .select('-password');

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        console.log('✅ Employee fetched successfully:', employee._id);

        res.status(200).json({
            success: true,
            message: "Employee fetched successfully",
            data: employee
        });

    } catch (error) {
        console.error('❌ Error fetching employee:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// ✅ UPDATE EMPLOYEE
export const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔄 Updating employee:', id, 'with data:', req.body);

        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array()
            });
        }

        const {
            name,
            email,
            phone,
            country,
            password,
            role,
            policies,
            state,
            city,
            status,
            company,
            internalId,
            address
        } = req.body;

        // Check if employee exists
        const existingEmployee = await User.findById(id);
        if (!existingEmployee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        // Check if email is being changed and if it's already taken
        if (email && email !== existingEmployee.email) {
            const emailExists = await User.findOne({ email, _id: { $ne: id } });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: "Email already exists for another employee"
                });
            }
        }

        // Get coordinates from address if provided
        let coordinates = { latitude: null, longitude: null };
        if (address && address !== existingEmployee.location?.address) {
            console.log('🗺️ Getting coordinates for updated address:', address);
            coordinates = await getCoordinatesFromAddress(address);
            console.log('📍 Coordinates received:', coordinates);
        } else if (existingEmployee.location) {
            coordinates = {
                latitude: existingEmployee.location.latitude,
                longitude: existingEmployee.location.longitude
            };
        }

        // Hash password if provided
        let hashedPassword = existingEmployee.password;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 12);
        }

        // Prepare update data
        const updateData = {
            name,
            email,
            phone,
            country,
            state,
            city,
            role,
            policies,
            status,
            company,
            internalId,
            password: hashedPassword,
            location: {
                address,
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

        const updatedEmployee = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
        .populate('company', 'name')
        .populate('details.vehicle', 'plateNumber make model')
        .select('-password');

        console.log('✅ Employee updated successfully:', updatedEmployee._id);

        res.status(200).json({
            success: true,
            message: "Employee updated successfully",
            data: updatedEmployee
        });

    } catch (error) {
        console.error('❌ Error updating employee:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// ✅ UPDATE EMPLOYEE STATUS
export const updateEmployeeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        console.log('🔄 Updating employee status:', id, 'to:', status);

        if (!status || !['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Must be 'active' or 'inactive'"
            });
        }

        const employee = await User.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        )
        .populate('company', 'name')
        .select('-password');

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        console.log('✅ Employee status updated successfully:', employee._id);

        res.status(200).json({
            success: true,
            message: "Employee status updated successfully",
            data: employee
        });

    } catch (error) {
        console.error('❌ Error updating employee status:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// ✅ DELETE EMPLOYEE
export const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔄 Deleting employee:', id);

        const employee = await User.findByIdAndDelete(id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        console.log('✅ Employee deleted successfully:', employee._id);

        res.status(200).json({
            success: true,
            message: "Employee deleted successfully",
            data: {
                _id: employee._id,
                name: employee.name,
                email: employee.email
            }
        });

    } catch (error) {
        console.error('❌ Error deleting employee:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// ✅ BULK DELETE EMPLOYEES
export const bulkDeleteEmployees = async (req, res) => {
    try {
        const { employeeIds } = req.body;
        console.log('🔄 Bulk deleting employees:', employeeIds);

        if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide an array of employee IDs"
            });
        }

        const result = await User.deleteMany({ _id: { $in: employeeIds } });

        console.log(`✅ Bulk deleted ${result.deletedCount} employees`);

        res.status(200).json({
            success: true,
            message: `${result.deletedCount} employees deleted successfully`,
            data: {
                deletedCount: result.deletedCount
            }
        });

    } catch (error) {
        console.error('❌ Error bulk deleting employees:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// ✅ GET EMPLOYEE STATISTICS
export const getEmployeeStats = async (req, res) => {
    try {
        console.log('🔄 Fetching employee statistics');

        // First, let's see what users exist
        const allUsers = await User.find({}).select('name email role status');
        console.log('👥 All users in database:', allUsers);

        const stats = await User.aggregate([
            {
                $match: {
                    role: { $nin: ['admin', 'superadmin', 'driver'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalEmployees: { $sum: 1 },
                    activeEmployees: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    },
                    inactiveEmployees: {
                        $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
                    }
                }
            }
        ]);

        console.log('📊 Employee stats aggregation result:', stats);

        const roleStats = await User.aggregate([
            {
                $match: {
                    role: { $nin: ['admin', 'superadmin', 'driver'] }
                }
            },
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        console.log('📊 Role stats aggregation result:', roleStats);

        const monthlyStats = await User.aggregate([
            {
                $match: {
                    role: { $nin: ['admin', 'superadmin', 'driver'] }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$joinDate' },
                        month: { $month: '$joinDate' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
        ]);

        const result = {
            totalEmployees: stats.length > 0 ? stats[0].totalEmployees : 0,
            activeEmployees: stats.length > 0 ? stats[0].activeEmployees : 0,
            inactiveEmployees: stats.length > 0 ? stats[0].inactiveEmployees : 0,
            roleStats: roleStats,
            monthlyStats: monthlyStats
        };

        console.log('📊 Final result:', result);

        console.log('✅ Employee statistics fetched successfully');

        res.status(200).json({
            success: true,
            message: "Employee statistics fetched successfully",
            data: result
        });

    } catch (error) {
        console.error('❌ Error fetching employee statistics:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// ✅ RESET EMPLOYEE PASSWORD
export const resetEmployeePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        
        console.log('🔄 Resetting password for employee:', id);

        // Check if password is provided
        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password is required"
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long"
            });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 12);

        const employee = await User.findByIdAndUpdate(
            id,
            { password: hashedPassword },
            { new: true }
        ).select('-password');

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        console.log('✅ Employee password reset successfully:', employee._id);

        res.status(200).json({
            success: true,
            message: "Employee password reset successfully",
            data: {
                _id: employee._id,
                name: employee.name,
                email: employee.email
            }
        });

    } catch (error) {
        console.error('❌ Error resetting employee password:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

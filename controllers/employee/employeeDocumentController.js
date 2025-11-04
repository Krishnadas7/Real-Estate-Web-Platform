import { EmployeeDocument } from "../../models/driver/employeeDocumentModel.js";
import { User } from "../../models/driver/userModel.js";
import { validationResult } from "express-validator";

// ✅ CREATE EMPLOYEE DOCUMENT
export const createEmployeeDocument = async (req, res) => {
    try {
        console.log('🔄 Creating employee document with data:', req.body);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array()
            });
        }

        const {
            employee,
            documentType,
            documentNumber,
            issueDate,
            expiryDate,
            description,
            status = 'valid'
        } = req.body;

        // ✅ Extract file metadata from uploaded file
        let fileMetadata = {};
        if (req.file) {
            // For S3 (production)
            const fileUrl = req.file.location || null;
            // For local storage (development)
            const localFileUrl = req.file.path ? `${process.env.BASE_URL || 'http://localhost:3000'}/${req.file.path.replace(/\\/g, '/')}` : null;
            
            fileMetadata = {
                fileUrl: fileUrl || localFileUrl,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype
            };
            console.log('📁 File uploaded successfully:', fileMetadata);
        }

        // Check if employee exists and belongs to the same company
        const employeeExists = await User.findById(employee);
        if (!employeeExists) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        // Check if employee belongs to the same company
        if (req.user.company && employeeExists.company && employeeExists.company.toString() !== req.user.company.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only create documents for employees in your company"
            });
        }

        // Check if document type already exists for this employee (filter by company if applicable)
        const duplicateCheckFilter = {
            employee,
            documentType,
            status: { $ne: 'expired' }
        };
        if (req.user.company) {
            duplicateCheckFilter.company = req.user.company;
        }
        const existingDocument = await EmployeeDocument.findOne(duplicateCheckFilter);

        if (existingDocument) {
            return res.status(400).json({
                success: false,
                message: `Document of type '${documentType}' already exists for this employee`
            });
        }

        // ✅ Auto-determine status based on expiry date
        let autoStatus = status || 'valid'; // Default to provided status or 'valid'
        if (expiryDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
            
            const expiry = new Date(expiryDate);
            expiry.setHours(0, 0, 0, 0);
            
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(today.getDate() + 30);
            thirtyDaysFromNow.setHours(0, 0, 0, 0);
            
            // Auto-determine status based on expiry date
            if (expiry < today) {
                // Expiry date is in the past → expired
                autoStatus = 'expired';
                console.log('📅 Expiry date is in the past - setting status to "expired"');
            } else if (expiry <= thirtyDaysFromNow) {
                // Expiry date is within 30 days → expiring soon
                autoStatus = 'expiring-soon';
                console.log('📅 Expiry date is within 30 days - setting status to "expiring-soon"');
            } else {
                // Expiry date is more than 30 days away → valid
                autoStatus = 'valid';
                console.log('📅 Expiry date is more than 30 days away - setting status to "valid"');
            }
        }

        const documentData = {
            employee,
            documentType,
            documentNumber,
            issueDate: issueDate ? new Date(issueDate) : null,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            description,
            status: autoStatus, // Use auto-determined status
            uploadedBy: req.user._id,
            company: req.user.company,
            // ✅ Include file metadata from upload
            ...fileMetadata
        };

        const document = new EmployeeDocument(documentData);
        await document.save();

        // Populate the document with employee details
        await document.populate('employee', 'name email role');

        console.log('✅ Employee document created successfully:', document._id);

        res.status(201).json({
            success: true,
            message: "Employee document created successfully",
            data: document
        });

    } catch (error) {
        console.error('❌ Error creating employee document:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// ✅ GET ALL EMPLOYEE DOCUMENTS WITH FILTERS
export const getAllEmployeeDocuments = async (req, res) => {
    try {
        const {
            employee,
            documentType,
            status,
            role,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        console.log('🔄 Fetching employees with their documents:', req.query);

        // Build document filter object
        const documentFilters = {};
        if (documentType) documentFilters.documentType = documentType;
        if (status) documentFilters.status = status;
        // Filter documents by company - include documents with matching company or no company set
        if (req.user.company) {
            documentFilters.$or = [
                { company: req.user.company },
                { company: null },
                { company: { $exists: false } }
            ];
        }

        // Build employee filter object
        const employeeFilters = {};
        // Filter by company - handle both employees with company and without company (null/undefined)
        if (req.user.company) {
            employeeFilters.$or = [
                { company: req.user.company },
                { company: null },
                { company: { $exists: false } }
            ];
        }
        // Filter by role if provided, otherwise exclude admin and superadmin only (allow driver)
        if (role) {
            employeeFilters.role = role;
        } else {
            // Default: exclude only admin and superadmin (allow driver and other roles)
            employeeFilters.role = { $nin: ['admin', 'superadmin'] };
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Get all employees first
        const employees = await User.find(employeeFilters)
            .select('name email phone country state city role status joinDate internalId location company')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));
        
        console.log('Found employees:', employees.length);

        // If specific employee is requested, filter by that employee (ignore role filter for specific employee lookup)
        if (employee) {
            const specificEmployeeFilter = { _id: employee };
            // Handle company filter - include employees with matching company or no company set
            if (req.user.company) {
                specificEmployeeFilter.$or = [
                    { company: req.user.company },
                    { company: null },
                    { company: { $exists: false } }
                ];
            }
            // Don't apply role filter when looking up specific employee - include all roles
            const specificEmployees = await User.find(specificEmployeeFilter)
                .select('name email phone country state city role status joinDate internalId location company');
            
            if (specificEmployees.length === 0) {
                return res.status(200).json({
                    success: true,
                    data: [],
                    pagination: {
                        current: parseInt(page),
                        pages: 0,
                        total: 0,
                        limit: parseInt(limit)
                    }
                });
            }
            employees.length = 0;
            employees.push(...specificEmployees);
        }

        // Get documents for each employee
        const employeesWithDocuments = await Promise.all(
            employees.map(async (emp) => {
                // Get documents for this employee
                const documents = await EmployeeDocument.find({
                    employee: emp._id,
                    ...documentFilters
                })
                .populate('uploadedBy', 'name email')
                .populate('verifiedBy', 'name email')
                .sort({ createdAt: -1 });

                console.log(`Employee ${emp.name} (${emp._id}, role: ${emp.role}) has ${documents.length} documents`);
                if (documents.length > 0) {
                    console.log(`  Document types: ${documents.map(d => d.documentType).join(', ')}`);
                }

                return {
                    employee: {
                        _id: emp._id,
                        name: emp.name,
                        email: emp.email,
                        phone: emp.phone,
                        country: emp.country,
                        state: emp.state,
                        city: emp.city,
                        role: emp.role,
                        status: emp.status,
                        joinDate: emp.joinDate,
                        internalId: emp.internalId,
                        location: emp.location,
                        company: emp.company
                    },
                    documents: documents
                };
            })
        );

        // Get total count of employees (for pagination)
        // If specific employee is selected, count should be 1
        let totalEmployees;
        if (employee) {
            totalEmployees = employees.length; // 1 if found, 0 if not
        } else {
            totalEmployees = await User.countDocuments(employeeFilters);
        }

        console.log(`✅ Found ${employeesWithDocuments.length} employees with their documents`);

        res.status(200).json({
            success: true,
            data: employeesWithDocuments,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(totalEmployees / parseInt(limit)),
                total: totalEmployees,
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('❌ Error fetching employees with documents:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// ✅ GET EMPLOYEE DOCUMENT BY ID
export const getEmployeeDocumentById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔄 Fetching employee document:', id);

        const document = await EmployeeDocument.findById(id)
            .populate('employee', 'name email role internalId')
            .populate('uploadedBy', 'name email')
            .populate('verifiedBy', 'name email');

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Employee document not found"
            });
        }

        console.log('✅ Employee document fetched successfully:', document._id);

        res.status(200).json({
            success: true,
            data: document
        });

    } catch (error) {
        console.error('❌ Error fetching employee document:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// ✅ UPDATE EMPLOYEE DOCUMENT
export const updateEmployeeDocument = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔄 Updating employee document:', id, 'with data:', req.body);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array()
            });
        }

        const {
            documentType,
            documentNumber,
            issueDate,
            expiryDate,
            description,
            status
        } = req.body;

        // ✅ Extract file metadata from uploaded file (if new file is uploaded)
        let fileMetadata = {};
        if (req.file) {
            // For S3 (production)
            const fileUrl = req.file.location || null;
            // For local storage (development)
            const localFileUrl = req.file.path ? `${process.env.BASE_URL || 'http://localhost:3000'}/${req.file.path.replace(/\\/g, '/')}` : null;
            
            fileMetadata = {
                fileUrl: fileUrl || localFileUrl,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype
            };
            console.log('📁 File updated successfully:', fileMetadata);
        }

        const existingDocument = await EmployeeDocument.findById(id);
        if (!existingDocument) {
            return res.status(404).json({
                success: false,
                message: "Employee document not found"
            });
        }

        // Check if document type already exists for this employee (excluding current document, filter by company if applicable)
        if (documentType && documentType !== existingDocument.documentType) {
            const duplicateCheckFilter = {
                employee: existingDocument.employee,
                documentType,
                status: { $ne: 'expired' },
                _id: { $ne: id }
            };
            if (req.user.company) {
                duplicateCheckFilter.company = req.user.company;
            }
            const duplicateDocument = await EmployeeDocument.findOne(duplicateCheckFilter);

            if (duplicateDocument) {
                return res.status(400).json({
                    success: false,
                    message: `Document of type '${documentType}' already exists for this employee`
                });
            }
        }

        // Prepare update data
        const updateData = {};
        if (documentType) updateData.documentType = documentType;
        if (documentNumber !== undefined) updateData.documentNumber = documentNumber;
        if (issueDate) updateData.issueDate = new Date(issueDate);
        if (expiryDate) updateData.expiryDate = new Date(expiryDate);
        if (description !== undefined) updateData.description = description;
        
        // ✅ Auto-update status based on expiry date if expiry date is being updated
        if (expiryDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
            
            const expiry = new Date(expiryDate);
            expiry.setHours(0, 0, 0, 0);
            
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(today.getDate() + 30);
            thirtyDaysFromNow.setHours(0, 0, 0, 0);
            
            // Auto-determine status based on expiry date
            if (expiry < today) {
                // Expiry date is in the past → expired
                updateData.status = 'expired';
                console.log('📅 Expiry date is in the past - setting status to "expired"');
            } else if (expiry <= thirtyDaysFromNow) {
                // Expiry date is within 30 days → expiring soon
                updateData.status = 'expiring-soon';
                console.log('📅 Expiry date is within 30 days - setting status to "expiring-soon"');
            } else {
                // Expiry date is more than 30 days away → valid
                updateData.status = 'valid';
                console.log('📅 Expiry date is more than 30 days away - setting status to "valid"');
            }
        } else if (status) {
            // If expiry date is not being updated but status is provided, use provided status
            updateData.status = status;
        }
        
        // ✅ Include file metadata if new file is uploaded
        if (Object.keys(fileMetadata).length > 0) {
            updateData.fileUrl = fileMetadata.fileUrl;
            updateData.fileName = fileMetadata.fileName;
            updateData.fileSize = fileMetadata.fileSize;
            updateData.mimeType = fileMetadata.mimeType;
        }

        const document = await EmployeeDocument.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        )
        .populate('employee', 'name email role internalId')
        .populate('uploadedBy', 'name email')
        .populate('verifiedBy', 'name email');

        console.log('✅ Employee document updated successfully:', document._id);

        res.status(200).json({
            success: true,
            message: "Employee document updated successfully",
            data: document
        });

    } catch (error) {
        console.error('❌ Error updating employee document:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// ✅ UPDATE DOCUMENT STATUS
export const updateDocumentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body;
        
        console.log('🔄 Updating document status:', id, 'to:', status);

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required"
            });
        }

        const validStatuses = ['valid', 'expiring-soon', 'expired', 'pending', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Must be one of: " + validStatuses.join(', ')
            });
        }

        const updateData = { status };
        
        // If status is rejected, require rejection reason
        if (status === 'rejected' && !rejectionReason) {
            return res.status(400).json({
                success: false,
                message: "Rejection reason is required when status is rejected"
            });
        }

        if (status === 'rejected') {
            updateData.rejectionReason = rejectionReason;
        } else {
            updateData.rejectionReason = null;
        }

        // If status is valid, mark as verified
        if (status === 'valid') {
            updateData.verifiedBy = req.user._id;
            updateData.verifiedAt = new Date();
        }

        const document = await EmployeeDocument.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        )
        .populate('employee', 'name email role internalId')
        .populate('uploadedBy', 'name email')
        .populate('verifiedBy', 'name email');

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Employee document not found"
            });
        }

        console.log('✅ Document status updated successfully:', document._id);

        res.status(200).json({
            success: true,
            message: "Document status updated successfully",
            data: document
        });

    } catch (error) {
        console.error('❌ Error updating document status:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// ✅ DELETE EMPLOYEE DOCUMENT
export const deleteEmployeeDocument = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔄 Deleting employee document:', id);

        const document = await EmployeeDocument.findByIdAndDelete(id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Employee document not found"
            });
        }

        console.log('✅ Employee document deleted successfully:', document._id);

        res.status(200).json({
            success: true,
            message: "Employee document deleted successfully"
        });

    } catch (error) {
        console.error('❌ Error deleting employee document:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// ✅ GET EMPLOYEE DOCUMENTS BY EMPLOYEE ID
export const getDocumentsByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;
        console.log('🔄 Fetching documents for employee:', employeeId);

        const documents = await EmployeeDocument.find({ employee: employeeId })
            .populate('employee', 'name email role internalId')
            .populate('uploadedBy', 'name email')
            .populate('verifiedBy', 'name email')
            .sort({ createdAt: -1 });

        console.log(`✅ Found ${documents.length} documents for employee ${employeeId}`);

        res.status(200).json({
            success: true,
            data: documents
        });

    } catch (error) {
        console.error('❌ Error fetching employee documents:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// ✅ UPDATE DOCUMENT STATUSES BASED ON EXPIRY
export const updateDocumentStatuses = async () => {
    try {
        console.log('🔄 Updating document statuses based on expiry dates...');
        
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        // Update documents that are expiring soon (within 30 days)
        const expiringSoonResult = await EmployeeDocument.updateMany(
            {
                expiryDate: {
                    $gte: today,
                    $lte: thirtyDaysFromNow
                },
                status: { $nin: ['expired', 'expiring-soon'] }
            },
            { 
                status: 'expiring-soon',
                updatedAt: new Date()
            }
        );

        // Update documents that have expired
        const expiredResult = await EmployeeDocument.updateMany(
            {
                expiryDate: { $lt: today },
                status: { $ne: 'expired' }
            },
            { 
                status: 'expired',
                updatedAt: new Date()
            }
        );

        console.log(`✅ Updated ${expiringSoonResult.modifiedCount} documents to 'expiring-soon'`);
        console.log(`✅ Updated ${expiredResult.modifiedCount} documents to 'expired'`);

        return {
            expiringSoon: expiringSoonResult.modifiedCount,
            expired: expiredResult.modifiedCount
        };

    } catch (error) {
        console.error('❌ Error updating document statuses:', error);
        throw error;
    }
};

// ✅ GET DOCUMENTS EXPIRING SOON
export const getExpiringDocuments = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        console.log(`🔄 Fetching documents expiring within ${days} days`);
        
        // Don't call updateDocumentStatuses here - it's already called by the scheduled job
        // This was causing unnecessary API calls and 404 errors

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + parseInt(days));

        const documents = await EmployeeDocument.find({
            expiryDate: {
                $gte: new Date(),
                $lte: futureDate
            },
            status: { $in: ['valid', 'expiring-soon'] }
        })
        .populate('employee', 'name email role internalId')
        .populate('uploadedBy', 'name email')
        .sort({ expiryDate: 1 });

        console.log(`✅ Found ${documents.length} documents expiring within ${days} days`);

        res.status(200).json({
            success: true,
            data: documents
        });

    } catch (error) {
        console.error('❌ Error fetching expiring documents:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// ✅ BULK DELETE EMPLOYEE DOCUMENTS
export const bulkDeleteEmployeeDocuments = async (req, res) => {
    try {
        const { documentIds } = req.body;
        console.log('🔄 Bulk deleting employee documents:', documentIds);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array()
            });
        }

        if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Document IDs array is required"
            });
        }

        const result = await EmployeeDocument.deleteMany({
            _id: { $in: documentIds }
        });

        console.log(`✅ Bulk deleted ${result.deletedCount} employee documents`);

        res.status(200).json({
            success: true,
            message: `${result.deletedCount} employee documents deleted successfully`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('❌ Error bulk deleting employee documents:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// ✅ GET EMPLOYEE DOCUMENT STATS
export const getEmployeeDocumentStats = async (req, res) => {
    try {
        console.log('🔄 Fetching employee document statistics');

        const companyFilter = req.user.company ? { company: req.user.company } : {};

        const stats = await EmployeeDocument.aggregate([
            { $match: companyFilter },
            {
                $lookup: {
                    from: 'users',
                    localField: 'employee',
                    foreignField: '_id',
                    as: 'employeeData'
                }
            },
            { $unwind: '$employeeData' },
            {
                $match: {
                    'employeeData.role': { $nin: ['admin', 'superadmin', 'driver'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalDocuments: { $sum: 1 },
                    validDocuments: {
                        $sum: { $cond: [{ $eq: ["$status", "valid"] }, 1, 0] }
                    },
                    expiringDocuments: {
                        $sum: { $cond: [{ $eq: ["$status", "expiring-soon"] }, 1, 0] }
                    },
                    expiredDocuments: {
                        $sum: { $cond: [{ $eq: ["$status", "expired"] }, 1, 0] }
                    },
                    pendingDocuments: {
                        $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
                    },
                    rejectedDocuments: {
                        $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] }
                    }
                }
            }
        ]);

        // Get document types distribution
        const documentTypes = await EmployeeDocument.aggregate([
            { $match: companyFilter },
            {
                $lookup: {
                    from: 'users',
                    localField: 'employee',
                    foreignField: '_id',
                    as: 'employeeData'
                }
            },
            { $unwind: '$employeeData' },
            {
                $match: {
                    'employeeData.role': { $nin: ['admin', 'superadmin', 'driver'] }
                }
            },
            {
                $group: {
                    _id: "$documentType",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Get expiring documents count
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const expiringCountResult = await EmployeeDocument.aggregate([
            { $match: companyFilter },
            {
                $lookup: {
                    from: 'users',
                    localField: 'employee',
                    foreignField: '_id',
                    as: 'employeeData'
                }
            },
            { $unwind: '$employeeData' },
            {
                $match: {
                    'employeeData.role': { $nin: ['admin', 'superadmin', 'driver'] },
                    expiryDate: {
                        $gte: new Date(),
                        $lte: thirtyDaysFromNow
                    },
                    status: { $ne: 'expired' }
                }
            },
            { $count: 'expiringIn30Days' }
        ]);

        const expiringCount = expiringCountResult.length > 0 ? expiringCountResult[0].expiringIn30Days : 0;

        const result = {
            ...stats[0],
            documentTypes,
            expiringIn30Days: expiringCount
        };

        console.log('✅ Employee document statistics fetched successfully');

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('❌ Error fetching employee document statistics:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

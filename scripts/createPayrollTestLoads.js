import mongoose from 'mongoose';
import Load from '../models/loadModel.js';
import { User } from '../models/driver/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

const createPayrollTestLoads = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blackriver');
    console.log('✅ Connected to MongoDB');

    // Get the first driver
    const driver = await User.findOne({ role: 'driver' });
    if (!driver) {
      console.log('❌ No driver found in database');
      await mongoose.connection.close();
      return;
    }

    console.log(`✅ Found driver: ${driver.name} (${driver.internalId})`);

    // Set mile rate for the driver if not set
    if (!driver.details?.mileRate || driver.details.mileRate === 0) {
      driver.details.mileRate = 0.65; // $0.65 per mile
      await driver.save();
      console.log('✅ Set driver mile rate to $0.65/mile');
    }

    // Check if test loads already exist
    const existingLoads = await Load.find({
      'details.internalId': { $in: ['PAYROLL-TEST-001', 'PAYROLL-TEST-002', 'PAYROLL-TEST-003'] }
    });

    if (existingLoads.length >= 3) {
      console.log('⚠️ All test loads already exist, skipping creation');
      
      // Check if they're completed
      const completedLoads = existingLoads.filter(l => l.status === 'completed');
      console.log(`ℹ️  Found ${completedLoads.length}/3 completed loads`);
      
      if (completedLoads.length < 3) {
        console.log('⚠️ Some loads are not completed, updating them...');
        await Load.updateMany(
          { 'details.internalId': { $in: ['PAYROLL-TEST-001', 'PAYROLL-TEST-002', 'PAYROLL-TEST-003'] } },
          { 
            status: 'completed',
            completedAt: new Date()
          }
        );
        console.log('✅ Updated test loads to completed status');
      }
      
      await mongoose.connection.close();
      return;
    }

    // Create test loads for payroll
    const now = new Date();
    const testLoads = [
      {
        details: {
          internalId: 'PAYROLL-TEST-001',
          customer: null,
          driver: driver._id,
          vehicle: null,
          amount: 0,
          rate: 0
        },
        route: {
          multipleDropOffs: false,
          selectPickup: {
            place: 'Toronto, ON',
            latitude: '43.6532',
            longitude: '-79.3832'
          },
          selectDropOff: {
            place: 'Montreal, QC',
            latitude: '45.5017',
            longitude: '-73.5673'
          },
          selectReturn: null
        },
        status: 'completed',
        assignedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        startedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 6 days 23 hours ago
        completedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) // 6 days ago
      },
      {
        details: {
          internalId: 'PAYROLL-TEST-002',
          customer: null,
          driver: driver._id,
          vehicle: null,
          amount: 0,
          rate: 0
        },
        route: {
          multipleDropOffs: false,
          selectPickup: {
            place: 'Montreal, QC',
            latitude: '45.5017',
            longitude: '-73.5673'
          },
          selectDropOff: {
            place: 'Ottawa, ON',
            latitude: '45.4215',
            longitude: '-75.6972'
          },
          selectReturn: null
        },
        status: 'completed',
        assignedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        startedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        completedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
      },
      {
        details: {
          internalId: 'PAYROLL-TEST-003',
          customer: null,
          driver: driver._id,
          vehicle: null,
          amount: 0,
          rate: 0
        },
        route: {
          multipleDropOffs: false,
          selectPickup: {
            place: 'Ottawa, ON',
            latitude: '45.4215',
            longitude: '-75.6972'
          },
          selectDropOff: {
            place: 'Toronto, ON',
            latitude: '43.6532',
            longitude: '-79.3832'
          },
          selectReturn: null
        },
        status: 'completed',
        assignedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        startedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        completedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      }
    ];

    const createdLoads = await Load.insertMany(testLoads);
    console.log(`✅ Created ${createdLoads.length} test loads for payroll:`);
    createdLoads.forEach(load => {
      console.log(`  - ${load.details.internalId}: ${load.status} (Completed: ${load.completedAt ? new Date(load.completedAt).toLocaleDateString() : 'N/A'})`);
    });

    await mongoose.connection.close();
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

createPayrollTestLoads();


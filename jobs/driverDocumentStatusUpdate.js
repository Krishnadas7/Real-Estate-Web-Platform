import cron from 'node-cron';
import { updateDriverDocumentStatuses } from '../controllers/driverDocumentController.js';

export const runDriverDocumentStatusUpdateJob = () => {
    // Schedule the job to run every day at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
        console.log('⏰ Running daily driver document status update job...');
        try {
            await updateDriverDocumentStatuses();
            console.log('✅ Daily driver document status update job completed successfully.');
        } catch (error) {
            console.error('❌ Error in daily driver document status update job:', error);
        }
    }, {
        scheduled: true,
        timezone: "America/New_York" // Or your desired timezone
    });

    console.log('✅ Driver document status update job scheduled to run daily at 9:00 AM.');
};

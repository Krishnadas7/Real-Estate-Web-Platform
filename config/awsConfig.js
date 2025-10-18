import { S3Client } from "@aws-sdk/client-s3";
import "dotenv/config";

// ✅ Create AWS S3 client
export const s3 = new S3Client({
  region: process.env.AWS_REGION, // e.g. "ap-south-1"
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configure the S3 client using AWS SDK v2
import AWS from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

let s3;
if (!s3) {
  s3 = new AWS.S3({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
    signatureVersion: "v4",
    s3ForcePathStyle: true,
  });
}

const IMAGE_EXPIRY = 60 * 60 * 24 * 7; // URL expiry time in seconds (7 days)
const S3_BUCKET = process.env.S3_BUCKET;

// Update your get signed URL function
async function getSignedUrl(key, exp = IMAGE_EXPIRY) {
  const params = {
    Bucket: S3_BUCKET,
    Key: key,
    Expires: exp,
  };

  return s3.getSignedUrlPromise("getObject", params);
}

// Upload file to S3
async function uploadToS3(key, body, contentType) {
  const params = {
    Bucket: S3_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  };

  return s3.upload(params).promise();
}

// Delete a file from S3
async function removeFromS3(key) {
  const params = {
    Bucket: S3_BUCKET,
    Key: key,
  };

  try {
    await s3.deleteObject(params).promise();
    return { success: true };
  } catch (error) {
    console.error(`S3 delete error for ${key}:`, error);
    return { success: false, error: error.message };
  }
}

const S3_TEMP_BUCKET = "talent-dashboard";

export { s3, getSignedUrl, uploadToS3, S3_TEMP_BUCKET, removeFromS3 };

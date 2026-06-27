import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

// configure cloudinary 
// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto', // this will automatically detect the file type (image, video, etc.)
        });
        console.log('File uploaded to Cloudinary successfully, File Source: ' + response.url);
        // Once the file is uploaded to Cloudinary, we can delete the local file
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        try {
            fs.unlinkSync(localFilePath); // Attempt to delete the file even if upload fails
        } catch (unlinkError) {
            console.error('Error deleting local file:', unlinkError);
        }
        return null;
    }
};

export { uploadOnCloudinary };
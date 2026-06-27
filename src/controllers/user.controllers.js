import {ApiError} from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { User } from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";  
import { ApiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    const {fullname, username, email, password } = req.body;
    // Validation
    if ([fullname, username, email, password].some(field => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }
    const existedUser = await User.findOne({
        $or:[{username}, {email}]
    })
    if (existedUser) {
        throw new ApiError(400, "User with email or username already exists");
    }

    req.files?.avatar
    
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverLocalPath = req.files?.cover?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar and cover images are required");
    }

    // const avatar = await uploadOnCloudinary(avatarLocalPath);
    // let coverImage = ""
    // if (coverLocalPath) {
    //     const coverImage = await uploadOnCloudinary(coverImage);
    // }
    let avatar;
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath);
        console.log("Uploaded avatar",avatar);
        
    } catch (error) {
        console.error("Error uploading avatar to Cloudinary:", error);
        throw new ApiError(500, "Failed to upload avatar image");
    }
    let coverImage;
    try {
        coverImage = await uploadOnCloudinary(coverLocalPath);
        console.log("Uploaded cover image",coverImage);
        
    } catch (error) {
        console.error("Error uploading cover image to Cloudinary:", error);
        throw new ApiError(500, "Failed to upload cover image");
    }

    
    const user = await User.create({
        fullname,
        avatar: avatar.secure_url,
        coverImage: coverImage?.secure_url || "",
        email,
        password,
        username : username.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "User creation failed");
    }

    return res.status(201).json(
        new ApiResponse(200, "User created successfully", createdUser))

})

export { registerUser }
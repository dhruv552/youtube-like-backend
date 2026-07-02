import {ApiError} from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { User } from "../models/user.models.js";
import {uploadOnCloudinary , deleteFromCloudinary} from "../utils/cloudinary.js";  
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";


const generateAceessAndRefreshTokens = async (userId) => {
   try {
     const user = await User.findById(userId);
     if (!user) {
         throw new ApiError(404, "User not found");
     }
     const accessToken = user.generateAccessToken();
     const refreshToken = user.generateRefreshToken();
 
     user.refreshToken = refreshToken;
     return { accessToken, refreshToken };
     await user.save({validateBeforeSave: false});
   } catch (error) {
    throw new ApiError(500, "Failed to generate tokens");
   }



}

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

    
    try {
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
    } catch (error) {
        console.error("Error creating user:", error);
        if(avatar){
            await deleteFromCloudinary(avatar.public_id);
        }
        if(coverImage){
            await deleteFromCloudinary(coverImage.public_id);
        }

        throw new ApiError(500, 
            "User creation failed , images and cover image deleted from cloudinary");
    }

})

const loginUser = asyncHandler(async (req, res) => {
    // get data from body
    const {email,username, password} = req.body;
    if(!email){
        throw new ApiError(400, "Email is required");
    }
    if(!password){
        throw new ApiError(400, "Password is required");
    }
    if(!username){
        throw new ApiError(400, "Username is required");
    }
    const user = await User.findOne({
        $or:[{username}, {email}]})
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // validate password

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }

    const {accessToken, refreshToken} = await generateAceessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    }
    return res.status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(new ApiResponse(200,
        {user: loggedInUser, accessToken, refreshToken},
        "User logged in successfully"
    ))


})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },{
            new: true,
        }
    )
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",}
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200,{}, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const IncomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!IncomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required");
    }

    try {
        const refreshedToken = jwt.verify(
            IncomingRefreshToken,process.env.JWT_REFRESH_SECRET)
    const user = await User.findById(decodedToken?.userId)
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    if(user?.refreshToken !== IncomingRefreshToken){
        throw new ApiError(401, "Invalid refresh token");
    }

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"}
    const {accessToken,refreshToken: newRefreshToken} = await generateAceessAndRefreshTokens(user._id)
    
    return res.status(200)
    .cookie("refreshToken", newRefreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(new ApiResponse(200,
        {user, accessToken, refreshToken: newRefreshToken},
        "Access token refreshed successfully"
    ))


    } catch (error) {
        throw new ApiError(500, "Something went wrong while refreshing access token");
    }

    
})

const changeCurrentPassword = asyncHandler(async(req,res) => {
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id);

    const isPasswordValid = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid old password");
    }

    user.password = newPassword;

    await user.save();

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req,res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullname, email} = req.body;

    if(!fullname || !email){
        throw new ApiError(400, "Fullname and email are required");
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email: email.toLowerCase()
        }
    },
    {  new: true }
    ).select("-password -refreshToken")

    return res.status(200)
          .json(new ApiResponse(200, user, 
            "Account details updated successfully"
                ))
})

const updateUserAvatar = asyncHandler(async(req,res) => {    
    const avatarLocalPath = req.files?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(500, "Failed to upload avatar image");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    return res.status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async(req,res) => {
    const coverImageLocalPath = req.files?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image is required");
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    
    if (!coverImage.url) {
        throw new ApiError(500, "Failed to upload cover image");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password -refreshToken")
    
    return res.status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"))
})


export {    registerUser ,
            loginUser,
            refreshAccessToken,
            logoutUser,
            changeCurrentPassword,
            getCurrentUser,
            updateAccountDetails,
            updateUserAvatar,
            updateUserCoverImage }
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {

    let error = err;

    if (!(error instanceof ApiError)) {

        const statusCode =
            error instanceof mongoose.Error ? 400 : error.statusCode || 500;

        error = new ApiError(
            statusCode,
            error.message || "Something went wrong",
            error.errors || [],
            error.stack
        );

    }

    const response = {

        success: false,
        message: error.message,

        ...(process.env.NODE_ENV === "development" && {
            stack: error.stack
        })

    };

    return res
        .status(error.statusCode || 500)
        .json(response);

}

export { errorHandler };
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

// CORS middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}));

// Body parser middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser())

// Static files
app.use(express.static('public'));

// import routes

import healthCheckRoutes from './routes/healthcheck.routes.js';
import userRoutes from './routes/user.routes.js';
import { errorHandler } from './middleware/error.middlewares.js';

// Use routes

app.use("/api/v1/healthcheck", healthCheckRoutes);
app.use("/api/v1/users", userRoutes);
app.use(errorHandler)


export default app;
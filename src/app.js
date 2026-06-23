import express from 'express';
import cors from 'cors';

const app = express();

// CORS middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}));

// Body parser middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Static files
app.use(express.static('public'));

// Routes will go here
// app.use('/api/users', userRoutes);

export default app;
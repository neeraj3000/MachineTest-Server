// Express app entry point: loads env from server/.env, connects to MongoDB,
// sets middleware, registers routes, and starts the HTTP server.
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { connectToDatabase } = require('./utils/db');

// Load environment variables from server/.env so local dev and production can differ
dotenv.config({ path: path.resolve(process.cwd(), 'server', '.env') });

const app = express();

// Allow frontend origin and include credentials for auth
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
// Parse JSON bodies
app.use(express.json({ limit: '2mb' }));
// Log requests to the console
app.use(morgan('dev'));

// Health check endpoint to verify the server is up
app.get('/api/health', (req, res) => {
	return res.json({ status: 'ok' });
});

// API routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/agents', require('./routes/agents.routes'));
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/tasks', require('./routes/tasks.routes'));

// Central error handler so all thrown errors return JSON
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
	console.error(err);
	if (res.headersSent) return;
	res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 4000;

// Connect to MongoDB first, then start listening for requests
connectToDatabase()
	.then(() => {
		app.listen(PORT, () => {
			console.log(`Server listening on port ${PORT}`);
		});
	})
	.catch((error) => {
		console.error('Failed to connect to database', error);
		process.exit(1);
	});

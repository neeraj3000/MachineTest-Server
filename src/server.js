const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { connectToDatabase } = require('./utils/db');

dotenv.config({ path: path.resolve(process.cwd(), 'server', '.env') });

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Health
app.get('/api/health', (req, res) => {
	return res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/agents', require('./routes/agents.routes'));
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/tasks', require('./routes/tasks.routes'));

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
	console.error(err);
	if (res.headersSent) return;
	res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 4000;

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

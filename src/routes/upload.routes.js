// Admin-only upload route: accepts CSV/XLSX, parses rows, and distributes tasks to agents
const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Task = require('../models/Task');
const { parseCsvOrExcel } = require('../utils/uploadParser');

const router = Router();

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'server', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Configure multer to save files to disk with a safe unique name
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    cb(null, `${base}_${Date.now()}${ext}`);
  }
});

// Only allow CSV and Excel files
function fileFilter(req, file, cb) {
  const allowed = ['.csv', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) {
    return cb(new Error('Invalid file type. Only csv, xlsx, xls allowed.'));
  }
  cb(null, true);
}

const upload = multer({ storage, fileFilter });

// Upload a file, parse rows, distribute tasks round-robin among up to 5 agents, and return summary
router.post('/', authenticate, authorize('ADMIN'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File is required' });

    const items = await parseCsvOrExcel(req.file.path);

    // Normalize and validate required fields in items
    const normalized = items
      .map((row) => ({
        firstName: String(row.FirstName || row.firstName || '').trim(),
        phone: String(row.Phone || row.phone || '').trim(),
        notes: String(row.Notes || row.notes || '').trim()
      }))
      .filter((r) => r.firstName && r.phone);

    if (normalized.length === 0) return res.status(400).json({ message: 'No valid rows found' });

    const agents = await User.find({ role: 'AGENT' }).sort({ createdAt: 1 });
    if (agents.length === 0) return res.status(400).json({ message: 'No agents to distribute to' });

    // Distribute equally among up to 5 agents (or exactly 5 if there are at least 5 agents)
    const distributionAgents = agents.slice(0, 5);

    const tasksToCreate = [];
    for (let i = 0; i < normalized.length; i++) {
      const agent = distributionAgents[i % distributionAgents.length];
      tasksToCreate.push({ agent: agent._id, ...normalized[i] });
    }

    await Task.insertMany(tasksToCreate);

    // Build response per agent for client display
    const byAgent = await Task.aggregate([
      { $match: { agent: { $in: distributionAgents.map((a) => a._id) } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$agent',
          tasks: { $push: { firstName: '$firstName', phone: '$phone', notes: '$notes' } }
        }
      }
    ]);

    const agentMap = new Map(distributionAgents.map((a) => [String(a._id), a]));
    const result = byAgent.map((g) => ({
      agent: {
        id: g._id,
        name: agentMap.get(String(g._id)).name,
        email: agentMap.get(String(g._id)).email
      },
      tasks: g.tasks
    }));

    res.json({ distributed: result });
  } catch (err) {
    next(err);
  } finally {
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
  }
});

module.exports = router;

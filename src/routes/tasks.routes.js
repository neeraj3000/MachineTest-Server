const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const Task = require('../models/Task');

const router = Router();

router.get('/me', authenticate, authorize('AGENT', 'ADMIN'), async (req, res) => {
  const query = req.user.role === 'ADMIN' ? {} : { agent: req.user._id };
  const tasks = await Task.find(query).sort({ createdAt: -1 });
  res.json({ tasks });
});

router.get('/by-agent/:agentId', authenticate, authorize('ADMIN'), async (req, res) => {
  const { agentId } = req.params;
  const tasks = await Task.find({ agent: agentId }).sort({ createdAt: -1 });
  res.json({ tasks });
});

module.exports = router;

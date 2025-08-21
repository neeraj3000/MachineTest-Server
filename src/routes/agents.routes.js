// Admin-only routes to list, create, update, and delete agents
const { Router } = require('express');
const { body, param, validationResult } = require('express-validator');
const User = require('../models/User');
const Task = require('../models/Task');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

// All routes below require ADMIN role
router.use(authenticate, authorize('ADMIN'));

// List all agents (password excluded)
router.get('/', async (req, res) => {
  const agents = await User.find({ role: 'AGENT' }).select('-password');
  res.json({ agents });
});

// Create a new agent
router.post(
  '/',
  [
    body('name').isString().trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('mobile')
      .isString()
      .matches(/^[0-9]{10}$/)
      .withMessage('Mobile must be in E.164 format like +15551234567'),
    body('password')
      .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
      .withMessage('Password must be 8+ chars with upper, lower, number, symbol')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, mobile, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already in use' });

    const agent = await User.create({ name, email, mobile, password, role: 'AGENT' });
    res.status(201).json({ agent: { id: agent._id, name: agent.name, email: agent.email, mobile: agent.mobile } });
  }
);

// Update agent
router.put(
  '/:id',
  [
    param('id').isMongoId(),
    body('name').optional().isString().trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
    body('mobile')
      .optional()
      .isString()
      .matches(/^\+[0-9]{10,15}$/)
      .withMessage('Mobile must be in E.164 format like +15551234567'),
    body('password')
      .optional()
      .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
      .withMessage('Password must be 8+ chars with upper, lower, number, symbol')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const { name, email, mobile, password } = req.body;

    const agent = await User.findOne({ _id: id, role: 'AGENT' });
    if (!agent) return res.status(404).json({ message: 'Agent not found' });

    if (email && email !== agent.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ message: 'Email already in use' });
      agent.email = email;
    }
    if (typeof name === 'string') agent.name = name;
    if (typeof mobile === 'string') agent.mobile = mobile;
    if (typeof password === 'string' && password) agent.password = password; // pre-save hook will hash

    await agent.save();
    res.json({ agent: { id: agent._id, name: agent.name, email: agent.email, mobile: agent.mobile } });
  }
);

// Delete agent and cascade delete their tasks
router.delete(
  '/:id',
  [param('id').isMongoId()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const agent = await User.findOneAndDelete({ _id: id, role: 'AGENT' });
    if (!agent) return res.status(404).json({ message: 'Agent not found' });

    await Task.deleteMany({ agent: agent._id });
    res.json({ ok: true });
  }
);

module.exports = router;

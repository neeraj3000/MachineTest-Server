const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    firstName: { type: String, required: true },
    phone: { type: String, required: true },
    notes: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);

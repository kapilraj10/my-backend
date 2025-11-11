import mongoose from '../db.js';

const testCaseSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  steps: { type: String },
  expected: { type: String },
  status: { type: String, enum: ['Not Run','Passed','Failed','Blocked'], default: 'Not Run' }
}, { timestamps: true });

export const TestCase = mongoose.model('TestCase', testCaseSchema);

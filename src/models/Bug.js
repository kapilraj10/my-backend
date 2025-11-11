import mongoose from '../db.js';

const bugSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  severity: { type: String, enum: ['Low','Medium','High','Critical'], default: 'Low' },
  status: { type: String, enum: ['Open','In Progress','Resolved','Closed'], default: 'Open' },
  description: { type: String }
}, { timestamps: true });

export const Bug = mongoose.model('Bug', bugSchema);

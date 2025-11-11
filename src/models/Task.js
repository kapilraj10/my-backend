import mongoose from '../db.js';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  assignee: { type: String },
  status: { type: String, enum: ['todo','in-progress','review','done'], default: 'todo' },
  progress: { type: Number, default: 0 }
}, { timestamps: true });

export const Task = mongoose.model('Task', taskSchema);

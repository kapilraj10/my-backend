import mongoose from '../db.js';

const teamMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  role: { type: String, enum: ['Developer','Tester','Manager','Designer','DevOps','Analyst','Other'], default: 'Developer' }
}, { timestamps: true });

export const TeamMember = mongoose.model('TeamMember', teamMemberSchema);

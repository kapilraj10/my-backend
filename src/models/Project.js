import mongoose from '../db.js';

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  team: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember' }],
  startDate: { type: Date },
  endDate: { type: Date },
  status: { type: String, enum: ['Planned','In Progress','Completed','On-Hold'], default: 'Planned' },
  priority: { type: String, enum: ['Low','Medium','High','Critical'], default: 'Medium' },
  completionPercent: { type: Number, default: 0 },
  archived: { type: Boolean, default: false },
  budget: { type: Number, default: 0 }
}, { timestamps: true });

export const Project = mongoose.model('Project', projectSchema);

import mongoose from '../db.js';

const financeEntrySchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  type: { type: String, enum: ['expense','payment'], required: true },
  amount: { type: Number, required: true },
  note: { type: String },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export const FinanceEntry = mongoose.model('FinanceEntry', financeEntrySchema);

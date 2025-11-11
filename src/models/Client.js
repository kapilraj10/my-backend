import mongoose from '../db.js';

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: String },
  contactName: { type: String },
  email: { type: String },
  phone: { type: String }
}, { timestamps: true });

export const Client = mongoose.model('Client', clientSchema);

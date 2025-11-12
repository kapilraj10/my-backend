// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';
import { connectDB } from './db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from './models/User.js';
import { Client } from './models/Client.js';
import { TeamMember } from './models/TeamMember.js';
import { Project } from './models/Project.js';
import { FinanceEntry } from './models/FinanceEntry.js';
import { TestCase } from './models/TestCase.js';
import { Bug } from './models/Bug.js';
import { Task } from './models/Task.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'letmein';
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

const allowedOrigins = [
  'http://localhost:3000',             // local dev
  'https://www.adminkapilrajkc.me',   // production frontend
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl or same-origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS policy: This origin is not allowed'), false);
    }
  },
  credentials: true,
}));
app.use(express.json());

// In-memory data stores (demo)
let projects = [
  { id: 'p1', name: 'Website Revamp', status: 'on-track', completionPercent: 72.4, startDate: '2025-09-01', endDate: '2026-02-15' },
  { id: 'p2', name: 'Mobile App', status: 'at-risk', completionPercent: 41.1, startDate: '2025-08-10', endDate: '2026-04-01' },
  { id: 'p3', name: 'Data Warehouse', status: 'delayed', completionPercent: 28.9, startDate: '2025-07-05', endDate: '2026-06-30' }
];

let finance = [
  { projectId: 'p1', income: 125000, expenses: 82000 },
  { projectId: 'p2', income: 80000, expenses: 67000 },
  { projectId: 'p3', income: 56000, expenses: 60000 }
];

let tasks = [
  { id: 't1', title: 'Set up CI pipeline', assignee: 'Alice', status: 'in-progress', progress: 55.2 },
  { id: 't2', title: 'Design landing page', assignee: 'Bob', status: 'review', progress: 82.7 },
  { id: 't3', title: 'Create database schema', assignee: 'Carol', status: 'todo', progress: 5.0 },
  { id: 't4', title: 'Implement auth', assignee: 'Dave', status: 'done', progress: 100.0 }
];

// Middleware for auth
function auth(requiredRole) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Missing token' });
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = payload;
      if (requiredRole && payload.role !== requiredRole && payload.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      next();
    } catch (e) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
}

// Bootstrap demo user on startup
async function ensureDemoUser() {
  const existing = await User.findOne({ email: 'admin@example.com' });
  if (!existing) {
    const user = new User({ email: 'admin@example.com', name: 'Admin', role: 'admin', passwordHash: '' });
    await user.setPassword(DEMO_PASSWORD);
    await user.save();
    console.log('Created demo admin user: admin@example.com');
  }
}

// Auth endpoints
app.get('/', async (req, res) => {
  res.send('Hello Developer Kapil 👨‍💻 — Backend API is running 🚀');
});
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email & password required' });
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await user.validatePassword(password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ sub: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, role: user.role, email: user.email });
});

app.post('/api/auth/demo', (req, res) => {
  const { password } = req.body || {};
  if (password === DEMO_PASSWORD) {
    const token = jwt.sign({ sub: 'demo', role: 'admin', email: 'demo@local' }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token, role: 'admin', email: 'demo@local' });
  }
  res.status(401).json({ message: 'Invalid password' });
});

// Clients CRUD
app.get('/api/clients', auth(), async (req, res) => {
  const list = await Client.find().sort('-createdAt');
  res.json(list);
});
app.post('/api/clients', auth('manager'), async (req, res) => {
  const created = await Client.create(req.body);
  res.status(201).json(created);
});
app.put('/api/clients/:id', auth('manager'), async (req, res) => {
  const updated = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});
app.delete('/api/clients/:id', auth('manager'), async (req, res) => {
  const deleted = await Client.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  res.status(204).end();
});

// Team members CRUD
app.get('/api/team', auth(), async (req, res) => {
  res.json(await TeamMember.find());
});
app.post('/api/team', auth('manager'), async (req, res) => {
  const created = await TeamMember.create(req.body);
  res.status(201).json(created);
});
app.put('/api/team/:id', auth('manager'), async (req, res) => {
  const updated = await TeamMember.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});
app.delete('/api/team/:id', auth('manager'), async (req, res) => {
  const deleted = await TeamMember.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  res.status(204).end();
});

// Projects CRUD (Mongo)
app.get('/api/projects', auth(), async (req, res) => {
  const items = await Project.find({ archived: false }).populate('client team');
  res.json(items);
});
app.post('/api/projects', auth('manager'), async (req, res) => {
  const created = await Project.create(req.body);
  res.status(201).json(created);
});
app.put('/api/projects/:id', auth('manager'), async (req, res) => {
  const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});
app.delete('/api/projects/:id', auth('manager'), async (req, res) => {
  const deleted = await Project.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  res.status(204).end();
});
app.post('/api/projects/:id/archive', auth('manager'), async (req, res) => {
  const updated = await Project.findByIdAndUpdate(req.params.id, { archived: true }, { new: true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});

// Finance entries
app.get('/api/finance', auth(), async (req, res) => {
  const entries = await FinanceEntry.find().populate('project');
  // Aggregate summary
  const summary = entries.reduce((acc, e) => {
    const pid = e.project?._id?.toString() || 'unknown';
    acc[pid] = acc[pid] || { project: e.project, expense: 0, payment: 0 };
    acc[pid][e.type] += e.amount;
    return acc;
  }, {});
  res.json({ entries, summary });
});
app.post('/api/finance', auth('manager'), async (req, res) => {
  const created = await FinanceEntry.create(req.body);
  res.status(201).json(created);
});
app.put('/api/finance/:id', auth('manager'), async (req, res) => {
  const updated = await FinanceEntry.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});
app.delete('/api/finance/:id', auth('manager'), async (req, res) => {
  const deleted = await FinanceEntry.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  res.status(204).end();
});

// Test cases
app.get('/api/testcases', auth(), async (req, res) => {
  res.json(await TestCase.find().populate('project'));
});
app.post('/api/testcases', auth('manager'), async (req, res) => {
  const created = await TestCase.create(req.body);
  res.status(201).json(created);
});
app.put('/api/testcases/:id', auth('manager'), async (req, res) => {
  const updated = await TestCase.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});
app.delete('/api/testcases/:id', auth('manager'), async (req, res) => {
  const deleted = await TestCase.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  res.status(204).end();
});

// Bugs
app.get('/api/bugs', auth(), async (req, res) => {
  res.json(await Bug.find().populate('project'));
});
app.post('/api/bugs', auth(), async (req, res) => {
  const created = await Bug.create(req.body);
  res.status(201).json(created);
});
app.put('/api/bugs/:id', auth(), async (req, res) => {
  const updated = await Bug.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});
app.delete('/api/bugs/:id', auth('manager'), async (req, res) => {
  const deleted = await Bug.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  res.status(204).end();
});

// Tasks (to support existing UI)
app.get('/api/tasks', auth(), async (req, res) => {
  res.json(await Task.find());
});
app.post('/api/tasks', auth(), async (req, res) => {
  const created = await Task.create(req.body);
  res.status(201).json(created);
});
app.put('/api/tasks/:id', auth(), async (req, res) => {
  const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});
app.delete('/api/tasks/:id', auth('manager'), async (req, res) => {
  const deleted = await Task.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  res.status(204).end();
});

// Reporting endpoint example
app.get('/api/reports/overview', auth(), async (req, res) => {
  const [projectCount, clientCount, teamCount, bugOpen] = await Promise.all([
    Project.countDocuments({ archived: false }),
    Client.countDocuments(),
    TeamMember.countDocuments(),
    Bug.countDocuments({ status: { $in: ['Open','In Progress'] } })
  ]);
  res.json({ projectCount, clientCount, teamCount, bugOpen });
});

async function start() {
  try {
    await connectDB(process.env.MONGODB_URI || 'mongodb://localhost:27017/dashboard');
    await ensureDemoUser();
    app.listen(PORT, () => {
      console.log(`API server listening on http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error('Failed to start server', e);
    process.exit(1);
  }
}

start();
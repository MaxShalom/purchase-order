const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Database Setup
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './submits.sqlite',
  logging: false
});

const Submission = sequelize.define('Submission', {
  factory: { type: DataTypes.STRING, allowNull: false },
  styleNumber: { type: DataTypes.STRING, allowNull: false },
  season: { type: DataTypes.STRING, allowNull: false },
  year: { type: DataTypes.INTEGER, allowNull: false },
  dateSent: { type: DataTypes.DATEONLY, allowNull: false },
  sampleType: { type: DataTypes.STRING, allowNull: false },
  shipper: { type: DataTypes.STRING, allowNull: false },
  trackingNumber: { type: DataTypes.STRING },
  comments: { type: DataTypes.TEXT },
  status: { type: DataTypes.STRING, defaultValue: 'New' }, // New, Pending, Archived
});

// Sync Database
sequelize.sync().then(() => {
  console.log('Database & tables created!');
});

// API Routes

// Create Submissions
app.post('/api/submissions', async (req, res) => {
  try {
    const submissions = req.body; // Expecting an array
    if (!Array.isArray(submissions)) {
      return res.status(400).json({ error: 'Input should be an array of submissions' });
    }
    const created = await Submission.bulkCreate(submissions);
    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get All Submissions (Protected ideally, but simple for now)
app.get('/api/submissions', async (req, res) => {
  try {
    const submissions = await Submission.findAll();
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update Submission
app.put('/api/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { comments, status } = req.body;
    const submission = await Submission.findByPk(id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (comments !== undefined) submission.comments = comments;
    if (status !== undefined) submission.status = status;

    await submission.save();
    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

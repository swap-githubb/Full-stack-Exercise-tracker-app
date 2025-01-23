const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ObjectId = require('mongoose').Types.ObjectId;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Connect to MongoDB
mongoose.connect("mongodb+srv://shiv200:shiv123@us.uk3hu.mongodb.net/?retryWrites=true&w=majority&appName=us"
)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("Database connection error:", err));

// User schema and model
const schema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  exercises: [
    {
      description: String,
      duration: Number,
      date: Date,
    },
  ],
});

const User = mongoose.model('User', schema);

// POST /api/users - Create a new user
app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;
    const user = new User({ username });
    const savedUser = await user.save();
    res.json({ username: savedUser.username, _id: savedUser._id });
  } catch (err) {
    res.status(500).send('Error creating user');
  }
});

// GET /api/users - Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, '_id username');
    res.json(users);
  } catch (err) {
    res.status(500).send('Error fetching users');
  }
});

// POST /api/users/:_id/exercises - Add exercise for a user
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const { _id } = req.params;
    let { description, duration, date } = req.body;

    duration = parseInt(duration);
    if (!date) date = new Date();
    else date = new Date(date);

    const user = await User.findById(_id);
    if (!user) return res.status(404).send('User not found');

    const exercise = { description, duration, date };
    user.exercises.push(exercise);
    await user.save();

    res.json({
      username: user.username,
      description,
      duration,
      date: date.toDateString(),
      _id: user._id,
    });
  } catch (err) {
    res.status(500).send('Error adding exercise');
  }
});

// GET /api/users/:_id/logs - Get user's exercise log
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const { _id } = req.params;
    const { from, to, limit } = req.query;

    const user = await User.findById(_id);
    if (!user) return res.status(404).send('User not found');

    let log = user.exercises.map((exercise) => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
    }));

    // Filter by "from" and "to" dates
    if (from) {
      const fromDate = new Date(from);
      log = log.filter((exercise) => new Date(exercise.date) >= fromDate);
    }

    if (to) {
      const toDate = new Date(to);
      log = log.filter((exercise) => new Date(exercise.date) <= toDate);
    }

    // Apply limit
    if (limit) {
      log = log.slice(0, parseInt(limit));
    }

    res.json({
      _id: user._id,
      username: user.username,
      count: log.length,
      log,
    });
  } catch (err) {
    res.status(500).send('Error fetching logs');
  }
});

// Start the server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});


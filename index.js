// const express = require('express')
// const app = express()
// const cors = require('cors')
// require('dotenv').config()

// const mongoose=require('mongoose');
// const bodyParser=require('body-parser');
// const ObjectId = require('mongoose').Types.ObjectId;
// app.use(bodyParser.urlencoded({extended:false}));
// app.use(bodyParser.json());
// app.use(cors())

// app.use(express.static('public'))
// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/views/index.html')
// });

// mongoose.connect("mongodb+srv://shiv200:shiv123@us.uk3hu.mongodb.net/?retryWrites=true&w=majority&appName=us")
// .then(console.log("Connected"))
// .catch((err)=>{console.log("Not connected")});

// const schema=new mongoose.Schema({
//   username: { type: String, require: true, unique: true },
//   exercises: [{
//       description: String,
//       duration: Number,
//       date: Date
//   }]
// });

// const User=mongoose.model("User",schema);

// app.post('/api/users',(req,res)=>{
//   const username = req.body.username;
//   User.create({ username: username });
//   res.json({ _id: req.params.id, username: req.body.username });
// });

// app.get('/api/users',(req,res)=>{
//   const alluser=User.find({});
//     res.json(alluser);

// });

// app.post('/api/users/:_id/exercises',(req,res)=>{

//   const id = req.params.id;
//     let { description, duration, date } = req.body;

//     const newExercise = {
//         description: description,
//         duration: duration,
//         date: date ? new Date(date).toDateString() : new Date().toDateString()
//     };

//     User.findOne({ _id: new ObjectId(id) }, (err, data) => {
//             if (err) return res.send(ERROR)
//             data.exercises.push(newExercise);
//             data.save((err, data) => {
//                 const response = {
//                     username: data.username,
//                     description: data.exercises[data.exercises.length - 1].description,
//                     duration: data.exercises[data.exercises.length - 1].duration,
//                     date: new Date(data.exercises[data.exercises.length - 1].date).toDateString(),
//                     _id: data._id
//                 };

//                 res.json(response)
//             })
//         }
//     )

// });

// app.get('/api/users/:_id/logs',(req,res)=>{
//   const id = req.params.id;

//   User.findOne({ _id: new ObjectId(id) }, (err, data) => {
//     if (err) return res.send("ERROR");

//     let log = [];

//     for (const exercise of data.exercises) {
//       log.push({
//           description: exercise.description,
//           duration: exercise.duration,
//           date: new Date(exercise.date).toDateString()
//       })
//   }
//   res.json({
//     _id: data._id,
//     username: data.username,
//     count: log.length,
//     log: log
// })
// });
// });








// const listener = app.listen(process.env.PORT || 3000, () => {
//   console.log('Your app is listening on port ' + listener.address().port)
// })



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


const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')
const crypto = require("crypto")

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const databaseUsers = []

app.post("/api/users", (req, res) => {
  const username = req.body.username;
  const user = databaseUsers.find((element) => element.username === username);
  if(!user) {
    databaseUsers.push({
      username: username,
      _id : crypto.randomBytes(16).toString("hex")
    });
  };
  res.send(databaseUsers[databaseUsers.length - 1]);
})

app.post("/api/users/:_id/exercises", (req, res) => {
  const userId = req.params._id;
  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  const date = req.body.date;
  const user = databaseUsers.find((user) => user._id === userId);

  if (!user) {
    console.log("ERROR: USER NOT FOUND!")
    return res.status(404).json({ error: "User not found" });
  }

  if (!description) {
    console.log("ERROR: Description is required!")
    return res.status(400).json({ error: "Description is required" });
  }

  if (isNaN(duration) || duration <= 0) {
    console.log("ERROR: Invalid duration!")
    return res.status(400).json({ error: "Invalid duration" });
  }

  let exerciseDate;
  if (!date) {
    exerciseDate = new Date();
  } else {
    exerciseDate = new Date(date);
    if (!isValidDate(exerciseDate)) {
      console.log("Invalid date!!");
      exerciseDate = new Date();
    }
  }
  exerciseDate = exerciseDate.toDateString();

  const newExercise = {
    description: description,
    duration: duration,
    date: exerciseDate,
  };

  if (!user.hasOwnProperty("log")) {
    user.log = [newExercise];
  } else {
    user.log.push(newExercise);
  }
  
  res.json({
    username: user.username,
    description: description,
    duration: duration,
    date: exerciseDate,
    _id: user["_id"],
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  const id = req.params["_id"];
  const fromDate = new Date(req.query.from);
  const toDate = new Date(req.query.to);
  const limit = parseInt(req.query.limit); 
  const user = databaseUsers.find((element) => element["_id"] === id);
  
  if(!user) {
    console.log("Invalid user");
    res.send({error: "invalid user"});
    return;
  }
  
  if(user.hasOwnProperty("log")) {
    let filteredLog = [ ...user.log ].sort((first, second) => new Date(first.date) - new Date(second.date));
    if (isValidDate(fromDate) && isValidDate(toDate)) {
      filteredLog = filteredLog.filter((element) => new Date(element.date) > fromDate && new Date(element.date) < toDate);
    }
    if(limit > 0) {
      filteredLog = filteredLog.slice(0, limit);
    }
    
    if ((isValidDate(fromDate) && isValidDate(toDate)) || limit > 0) {
      // retrieve the length of the updated array
      const { length: count } = filteredLog;
      const { username } = user; 
      res.send({
        _id: user["_id"],
        username: username,
        count: count,
        log: filteredLog
      });
      return;
    }
    let length = user["log"].length;
    user["count"] = length;
  }
  res.send(user);
})

function isValidDate(dateString) {
  // Create a new Date object from the provided string
  const date = new Date(dateString);
  
  // Check if the date is valid and the parsing didn't result in "Invalid Date"
  return date instanceof Date && !isNaN(date);
}

app.get("/api/users", (req, res) => {
  res.send(databaseUsers.map(element => {
    return {
      username: element["username"],
      _id: element["_id"]
    };
  }));
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

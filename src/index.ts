import * as config from "../env.config.json";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import { User, UserModel } from "./database/user";
import { Exercise, ExerciseModel } from "./database/exercise";
import { Moment } from "moment";
import moment from "moment";

mongoose.connect(
  config.mongodb.uri
    .replace("<username>", config.mongodb.username)
    .replace("<password>", config.mongodb.password)
);

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", async (req, res) => {
  try {
    if (!req.body.username) {
      return res.status(400).json({ error: "username is required" });
    }

    let createdUser = await UserModel.create({ username: req.body.username });

    res.status(201).json(createdUser);
  } catch (err) {
    res.status(500).json({ error: "internal server error" });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    let users = await UserModel.find({});
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "internal server error" });
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    if (!(req.body.description && req.body.duration)) {
      return res
        .status(400)
        .json({ error: "description and duration are required" });
    }

    let user = await UserModel.findById(req.params._id);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    const newExercise: Exercise = {
      date: req.body.date || Date.now(),
      description: req.body.description,
      duration: req.body.duration,
      userId: req.params._id,
    };

    let exercise = await ExerciseModel.create(newExercise);

    const result = {
      _id: req.params._id,
      username: user.username,
      date: moment.utc(exercise.date).toString(),
      description: exercise.description,
      duration: exercise.duration,
    };

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: "internal server error" });
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const from = moment.utc(req.query.from as string, "yyyy-mm-dd");
    const to = moment.utc(req.query.to as string, "yyyy-mm-dd");

    let user = await UserModel.findById(req.params._id);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    let exerciseQuery = ExerciseModel.find({ userId: req.params._id }, [
      "date",
      "description",
      "duration",
    ]);

    if (from.isValid())
      exerciseQuery = exerciseQuery.where({
        date: { $gte: from.toISOString() },
      });
    if (to.isValid())
      exerciseQuery = exerciseQuery.where({ date: { $lte: to.toISOString() } });

    if (req.query.limit) {
      exerciseQuery = exerciseQuery.limit(parseInt(req.query.limit as string));
    }

    let exercises = await exerciseQuery.exec();

    const result = {
      _id: req.params._id,
      username: user.username,
      count: exercises.length,
      log: exercises.map((exercise) => {
        return {
          _id: exercise._id,
          date: moment.utc(exercise.date).toString(),
          description: exercise.description,
          duration: exercise.duration,
        };
      }),
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "internal server error" });
  }
});

app.listen(config.port, () => {
  console.log(`Server is listening at http://localhost:${config.port}`);
});

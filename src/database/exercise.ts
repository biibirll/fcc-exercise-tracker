import mongoose from "mongoose";

export interface Exercise {
  date?: Date;
  description: string;
  duration: number;
  userId: string;
}

export const ExerciseSchema = new mongoose.Schema<Exercise>({
  date: { type: Date, default: Date.now },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  userId: { type: String, required: true },
});

export const ExerciseModel = mongoose.model("exercise", ExerciseSchema);

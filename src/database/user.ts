import mongoose from "mongoose";

export interface User {
  username: string;
}

export const UserSchema = new mongoose.Schema<User>({
  username: {
    type: String,
    required: true,
    unique: true,
  },
});

export const UserModel = mongoose.model("user", UserSchema);

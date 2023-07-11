// import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: String,
  status: String,
  phoneNumber: String,
});

export default mongoose.model('user', userSchema);

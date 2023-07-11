// import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  text: String,
  sender: {
    name: String,
    phoneNumber: String,
  },
  receiver:{
    name:String,
    phoneNumber:String
  },
  createdAt: String,
  received: Boolean,
  // lastMessage: {
  //   id: 'm8',
  //   text: 'Send The pic',
  //   createdAt: '2020-09-27T15:40:00.000Z',
  // },
});

export default mongoose.model('messageContent', messageSchema);

// imports
import express from 'express';
import { createServer } from 'http';
import mongoose from 'mongoose';
import Message from './models/message.js';
import cors from 'cors';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/user.js';
// import { BadRequestError, UnauthenticatedError } from './errors/index.js';
import BadRequestError from './errors/bad-request.js';
import UnauthenticatedError from './errors/unauthenticated.js';
// import { BadRequestError, UnauthenticatedError } from './errors/index.js';

// app config
const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 5000;

// middlewares
app.use(express.json());

// DB config
const connection_url =
  'mongodb+srv://Ebube:EbubeLogin@cluster0.hreltnk.mongodb.net/whatsapp_db?retryWrites=true&w=majority';

// Socket IO
const io = new Server(httpServer, {
  cors: {
    origin: '<http://localhost:3000>',
    method: ['GET', 'POST', 'DELETE', 'PATCH'],
  },
});

io.on('connection', async socket => {
  console.log(`${socket.id} User Connected`);

  socket.on('input', async data => {
    const dbMessage = await data;
    await Message.create(dbMessage);
    let found = await Message.find({});

    const newFoundData = [];

    found.forEach(single => {
      if (
        (single.sender.phoneNumber === data.sender.phoneNumber &&
          single.receiver.phoneNumber === data.receiver.phoneNumber) ||
        (single.sender.phoneNumber === data.receiver.phoneNumber &&
          single.receiver.phoneNumber === data.sender.phoneNumber)
      ) {
        if (
          single.sender.phoneNumber === data.sender.phoneNumber ||
          single.sender.phoneNumber === data.receiver.phoneNumber
        )
          newFoundData.push(single);
      }
    });

    console.log(newFoundData);
    // console.log(found);
    socket.emit('output', newFoundData);
  });

  // socket.on('activateChatList', async users => {
  //   const sender = await Message.find({});
  //   const newData = [];
  //   const lastMessage = [];
  //   console.log(data);

  //   users.forEach(data => {
  //     sender.forEach(single => {
  //       if (
  //         (single.sender.phoneNumber === data.sender &&
  //           single.receiver.phoneNumber === data.receiver) ||
  //         (single.sender.phoneNumber === data.receiver &&
  //           single.receiver.phoneNumber === data.sender)
  //       ) {
  //         newData.push(single);
  //       }
  //     });
  //     lastMessage.push(newData[newData.length - 1]);
  //     console.log(lastMessage);
  //   });

  //   socket.emit('getLastMessage', newData[newData.length - 1]);
  // });

  socket.on('receiving_user', async data => {
    // console.log(data);

    const sender = await Message.find({});
    const newData = [];

    sender.forEach(single => { 
      if (
        (single.sender.phoneNumber === data.sender &&
          single.receiver.phoneNumber === data.receiver) ||
        (single.sender.phoneNumber === data.receiver &&
          single.receiver.phoneNumber === data.sender)
      ) {
        newData.push(single);
      }
    });

    // console.log(newData);
    socket.emit('immediate_output', newData);
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected', socket.id);
  });
});

// api routes
app.get('/', (req, res) => res.status(200).send('Whatsapp Clone API'));

app.get('/api/v1/messages', async (req, res) => {
  try {
    const data = await Message.find();

    res.status(200).send(`New Message Received: ${data}`);
  } catch (error) {
    res.status(500).send(err);
  }
});

app.post('/api/v1/messages/new', async (req, res) => {
  try {
    const dbMessage = await req.body;

    const data = await Message.create(dbMessage);

    res.status(201).send(`New Message Delivered: ${data}`);
  } catch (error) {
    res.status(500).send(err);
  }
});
app.post('/api/v1/register', async (req, res) => {
  try {
    const { name, status, phoneNumber } = await req.body;

    if (!name || !status || !phoneNumber) {
      throw new BadRequestError('Please provide all values');
      return;
    }
    const userAlreadyExists = await User.findOne({ phoneNumber });
    if (userAlreadyExists) {
      throw new UnauthenticatedError('Phone number already used');
      return;
    }

    const user = await User.create(req.body);

    const token = jwt.sign({ phoneNumber }, 'secret', {
      expiresIn: '1hr',
    });
    res.status(201).send({
      token,
      user: {
        _id: user._id,
        name: user.name,
        status: user.status,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (error) {
    res.status(error.statusCode).send(error.message);
  }
});

app.post('/api/v1/login', async (req, res) => {
  try {
    const { name, phoneNumber } = await req.body;

    if (!name || !phoneNumber) {
      throw new BadRequestError('Please provide all values');
    }
    const user = await User.findOne({ phoneNumber, name });

    if (!user) {
      throw new UnauthenticatedError('Invalid Credentials');
    }

    const token = jwt.sign({ phoneNumber }, 'secret', {
      expiresIn: '24hr',
    });

    res.status(200).json({ user, token });
  } catch (error) {
    res.status(error.statusCode).send(error.message);
  }
});

app.get('/api/v1/getUsers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const users = await User.find({});
    // console.log(id, users[0]._id.toHexString());
    const result = users.filter(user => id !== user._id.toHexString());
    console.log(result);
    res.status(200).send(result);
  } catch (err) {
    res.status(404).send(err.message);
  }
});

// listen
const start = async () => {
  try {
    await mongoose.connect(connection_url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    httpServer.listen(port, () => console.log(`Listening on port: ${port}`));
  } catch (err) {
    console.log(err);
  }
};

start();

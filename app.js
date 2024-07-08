const dotenv = require('dotenv');
dotenv.config({path: './config.env'});


const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');
const statusRoutes = require('./routes/status');

const app = express();

const PORT = process.env.PORT || 8080;
const DB_URL = process.env.DB_URL;

app.use(fileUpload({
  useTempFiles : true
}));

app.use(bodyParser.json()); // application/json

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);
app.use('/user', statusRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data});
});

mongoose
  .connect( DB_URL
  )
  .then(result => {
    console.log('I am inside the database');
    app.listen(PORT, ()=>{
      console.log(`connected to ${PORT} port`);
    });
  })
  .catch(err => console.log(err));

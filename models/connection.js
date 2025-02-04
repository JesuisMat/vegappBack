const mongoose = require('mongoose');
const connectionString = 'mongodb+srv://admin:5pChWNoQZYGQBBT3@cluster0.1767x.mongodb.net/vegapp';

mongoose.connect(connectionString, { connectTimeoutMS: 2000 })
  .then(() => console.log('Database connected'))
  .catch(error => console.error(error));
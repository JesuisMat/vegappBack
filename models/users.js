const mongoose = require('mongoose');

// Schéma pour les utilisateurs
const userSchema = mongoose.Schema({
 username : String, 
 password : String,
 token : String,
 email : String,
 favRecipes : Array,
 favBuisnesses : Array,
 regime : Array
});

const User = mongoose.model('users', userSchema);

module.exports = User;
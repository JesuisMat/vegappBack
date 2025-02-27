const mongoose = require('mongoose');

// Schéma pour les utilisateurs
const userSchema = mongoose.Schema({
 username : String, 
 password : String,
 token : String,
 email : String,
 favRecipes : Array,
 favBuisnesses: [{ 
    siret: String,
    name: String,
    adress: String,
    cp: String,
    ville: String,
    categories: [String],
    tel: String,
    sites: [String],
    lat: Number,
    lng: Number
  }],
 regime : Array, 
}, {
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
  });

const User = mongoose.model('users', userSchema);

module.exports = User;
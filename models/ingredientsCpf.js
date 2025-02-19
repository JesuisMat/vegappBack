const mongoose = require('mongoose');

// Schéma pour les ingrédients
const ingredientCpfSchema = new mongoose.Schema({
    id: Number,
    code: String,
    nom: String,
});

// Création du modèle avec le nom en minuscule
const ingredientcpf = mongoose.model('ingredientscpfs', ingredientCpfSchema);

module.exports = ingredientcpf;

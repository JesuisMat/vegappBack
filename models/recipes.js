const mongoose = require('mongoose');

// Schéma pour les ingrédients
const ingredientSchema = mongoose.Schema({
    name: String,
    icon: String,
    quantity: Number,
    unit: String
});

// Schéma pour les recettes
const recipeSchema = mongoose.Schema({
    title: {                          
        type: String,
        required: true
    },
    description: {                    // Ajout de la description courte pour les resultats recherche
        type: String,
        required: true
    },
    regime: {
        type: [String],
        enum: ['Vegan', 'Végé', 'Sans gluten', 'Bio']
    },
    ingredients: [ingredientSchema],
    category: {
        type: String,
        enum: ['STARTER', 'MAIN', 'DESSERT', 'PARTY', 'FAST FOOD', 'HEALTHY', 'AFRICA', 'ASIA', 'LATINO'],
        required: true
    },
    difficulty: {
        type: String,
        enum: ['EASY', 'MEDIUM', 'HARD'],
        required: true
    },
    cost: {
        type: Number,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    steps: {
        type: [String],
        required: true
    },
    averageNote: {
        type: Number,
        default: 0                    // Valeur par défaut à 0
    },
    voteNr: {
        type: Number,
        default: 0                    // Valeur par défaut à 0
    },
    shareLinks: {
        type: [String],
        default: []                   // Tableau vide par défaut
    }
});

// Création des modèles
const Recipe = mongoose.model('recipes', recipeSchema);
const Ingredient = mongoose.model('ingredients', ingredientSchema);

module.exports = { Recipe, Ingredient };
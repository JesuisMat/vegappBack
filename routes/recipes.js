var express = require('express');
var router = express.Router();
const { Recipe } = require('../models/recipes');

router.get('/search', async (req, res) => {
  try {
    // On crée un objet vide pour stocker nos critères de recherche
    let query = {};
    
    // Si l'utilisateur a tapé quelque chose dans la barre de recherche
    // On cherche dans le titre ET la description (grâce à $or)
    // Le 'i' dans RegExp veut dire "insensible à la casse" (Case insensitive)
    if (req.query.keyword) {
      const keyword = new RegExp(req.query.keyword, 'i');
      query.$or = [
        { title: keyword },
        { description: keyword }
      ];
    }
    // Gestion des régimes alimentaires (Vegan, Végé, etc.)
    // On vérifie si c'est un tableau ou une seule valeur
    if (req.query.regime) {
      // Si c'est une string, on la met dans un tableau
      // Sinon on garde le tableau tel quel
      const regimes = Array.isArray(req.query.regime) 
        ? req.query.regime 
        : [req.query.regime];
      
      // $all permet de chercher tous les régimes demandés
      // Par exemple: une recette qui est à la fois Vegan ET Bio
      query.regime = { $all: regimes };
    }
    
    // Filtre par tag de plats
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Gestion de la pagination
    // Par défaut: page 1 avec 10 résultats
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit; // Calcul du nombre de documents à sauter

    // On fait la requête à la base de données
    // select() permet de récupérer que les champs dont on a besoin
    const recipes = await Recipe.find(query)
      .skip(skip)
      .limit(limit)
      .select('title description regime category averageNote voteNr difficulty duration cost');

    // On compte le nombre total de recettes qui correspondent à la recherche
    // pour pouvoir calculer le nombre total de pages
    const total = await Recipe.countDocuments(query);

    res.json({ 
      result: true, 
      recipes,
      pagination: {
        current: page,           //nb total de pages
        pages: Math.ceil(total / limit), //Nb total de pages
        total                   // Nb total de recettes
      }
    });

  } catch (error) {
    // erreur quon renvoi au front
    res.json({ result: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    console.log('Received recipe data:', req.body);

    // Validate required fields
    if (!req.body.title || !req.body.description || !req.body.category) {
      return res.json({ 
        result: false, 
        error: 'Missing required fields' 
      });
    }

    // Create recipe without _id field
    const recipeData = {
      title: req.body.title,
      description: req.body.description,
      regime: req.body.regime || [],
      ingredients: req.body.ingredients || [],
      category: req.body.category,
      difficulty: req.body.difficulty || 'MEDIUM',
      cost: req.body.cost || 0,
      duration: req.body.duration || 0,
      steps: req.body.steps || []
    };

    const newRecipe = new Recipe(recipeData);
    console.log('Created new recipe instance:', newRecipe);

    const savedRecipe = await newRecipe.save();
    console.log('Saved recipe:', savedRecipe);

    res.json({ result: true, recipe: savedRecipe });
  } catch (error) {
    console.error('Error saving recipe:', error);
    res.json({ 
      result: false, 
      error: error.message,
      details: error.stack 
    });
  }
});

// GET /recipes - Récupération de toutes les recettes
router.get('/allRecipes', async (req, res) => {
  try {
    // On peut ajouter une limite pour ne pas tout récupérer d'un coup
    const recipes = await Recipe.find()
      .limit(20)
      .select('title description regime category averageNote voteNr difficulty duration cost steps');
    
    res.json({ result: true, recipes });
  } catch (error) {
    res.json({ result: false, error: error.message });
  }
});

// GET /recipes/:id - Récupération d'une recette par son ID
router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (recipe) {
      res.json({ result: true, recipe });
    } else {
      res.json({ result: false, error: 'Recipe not found' });
    }
  } catch (error) {
    res.json({ result: false, error: error.message });
  }
});

// PUT /recipes/:id - Mise à jour d'une recette
router.put('/:id', async (req, res) => {
  try {
    // findByIdAndUpdate prend l'ID, les nouvelles données et les options
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        description: req.body.description,
        regime: req.body.regime,
        ingredients: req.body.ingredients,
        category: req.body.category,
        difficulty: req.body.difficulty,
        cost: req.body.cost,
        duration: req.body.duration,
        steps: req.body.steps,
        // On ne met pas à jour averageNote et voteNr ici
        // car ils sont gérés par la route de vote
      },
      { new: true } // Cette option retourne le document mis à jour
    );

    if (updatedRecipe) {
      res.json({ result: true, recipe: updatedRecipe });
    } else {
      res.json({ result: false, error: 'Recipe not found' });
    }
  } catch (error) {
    res.json({ result: false, error: error.message });
  }
});

// DELETE /recipes/:id - Suppression d'une recette
router.delete('/:id', async (req, res) => {
  try {
    const deletedRecipe = await Recipe.findByIdAndDelete(req.params.id);
    
    if (deletedRecipe) {
      res.json({ result: true, message: 'Recipe deleted successfully' });
    } else {
      res.json({ result: false, error: 'Recipe not found' });
    }
  } catch (error) {
    res.json({ result: false, error: error.message });
  }
});

// POST /recipes/:id/vote - Route pour voter/noter une recette
router.post('/:id/vote', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.json({ result: false, error: 'Recipe not found' });
    }

    // Calcul de la nouvelle moyenne
    const newVoteNr = recipe.voteNr + 1;
    const newAverageNote = (recipe.averageNote * recipe.voteNr + req.body.note) / newVoteNr;

    // Mise à jour de la recette
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      {
        averageNote: newAverageNote,
        voteNr: newVoteNr
      },
      { new: true }
    );

    res.json({ result: true, recipe: updatedRecipe });
  } catch (error) {
    res.json({ result: false, error: error.message });
  }
});

module.exports = router;

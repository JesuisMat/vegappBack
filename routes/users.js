var express = require("express");
var router = express.Router();

require("../models/connection");
const User = require("../models/users");
const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

// route pour créér un.e utilisateur.ice
router.post("/signup", (req, res) => {
  // utilisation du module checkBody pour vérifier que tous les champs ont bien été renseignés
  if (!checkBody(req.body, ["username", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }
  // on regarde si l'utilisateur.ice est déjà en BDD
  User.findOne({ username: req.body.username }).then((data) => {
    // si c'est pas le cas, on créé user
    if (data === null) {
      // on hashe le password avec bcrypt.hashSync
      const hash = bcrypt.hashSync(req.body.password, 10);

      const newUser = new User({
        username: req.body.username,
        password: hash,
        // on utilise uid2 pour générer un token unique de 32 caractères aléatoires
        token: uid2(32),
        email: req.body.email,
        favRecipes: [],
        favBuisnesses: [],
        regime: [],
      });
      // on le save et on renvoie un json avec le result et le token user
      newUser.save().then((newDoc) => {
        res.json({ result: true, token: newDoc.token });
      });
    } else {
      // si l'utilisateur existe déjà on renvoie un json avec result : false avec message erreur
      res.json({ result: false, error: "User already exists" });
    }
  });
});

// route pour se connecter à son compte utilisateur.ice
router.post("/signin", (req, res) => {
  // utilisation du module checkBody pour vérifier que tous les champs ont bien été renseignés
  if (!checkBody(req.body, ["username", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }
  // on regarde si l'utilisateur.ice est déjà en BDD
  User.findOne({ username: req.body.username }).then((data) => {
    // on compare le mot de passe reçu avec celui enregistré en base de données via la méthode compareSync
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      // on récupère le token pour le stocker ensuite dans le reducer (le token sert à identifier l'utilisateur, le token peut être regénéré contrairement à l'id)
      res.json({
        result: true,
        token: data.token,
        email: data.email,
        username: data.username,
        favrecipes: data.favRecipes,
        favshops: data.favBuisnesses,
        regime: data.regime
      });
    } else {
      // si mauvais mot de passe on renvoie un json avec result : false avec message erreur
      res.json({ result: false, error: "User not found or wrong password" });
    }
  });
});

router.post("/bookmark", (req, res) => {
  // Vérifier que tous les champs requis sont présents
  if (!checkBody(req.body, ["token", "recipeId"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  // Rechercher l'utilisateur par son token
  User.findOne({ token: req.body.token }).then((user) => {
    if (!user) {
      res.json({ result: false, error: "User not found" });
      return;
    }

    // Vérifier si la recette est déjà dans les favoris
    if (user.favRecipes.includes(req.body.recipeId)) {
      res.json({ result: false, error: "Recipe already in favorites" });
      return;
    }

    // Ajouter la recette aux favoris
    User.updateOne(
      { token: req.body.token },
      { $push: { favRecipes: req.body.recipeId } }
    ).then(() => {
      res.json({ result: true, favRecipes: [...user.favRecipes, req.body.recipeId] });
    });
  });
});

// Route pour retirer une recette des favoris
router.delete("/bookmark", (req, res) => {
  // Vérifier que tous les champs requis sont présents
  if (!checkBody(req.body, ["token", "recipeId"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  // Rechercher l'utilisateur par son token
  User.findOne({ token: req.body.token }).then((user) => {
    if (!user) {
      res.json({ result: false, error: "User not found" });
      return;
    }

    // Vérifier si la recette est dans les favoris
    if (!user.favRecipes.includes(req.body.recipeId)) {
      res.json({ result: false, error: "Recipe not in favorites" });
      return;
    }

    // Retirer la recette des favoris
    User.updateOne(
      { token: req.body.token },
      { $pull: { favRecipes: req.body.recipeId } }
    ).then(() => {
      const updatedFavRecipes = user.favRecipes.filter(
        (id) => id !== req.body.recipeId
      );
      res.json({ result: true, favRecipes: updatedFavRecipes });
    });
  });
});

// Route pour récupérer toutes les recettes favorites d'un utilisateur
router.get("/bookmarks/:token", (req, res) => {
  User.findOne({ token: req.params.token }).then((user) => {
    if (!user) {
      res.json({ result: false, error: "User not found" });
      return;
    }

    // Si l'utilisateur n'a pas de favoris, retourner un tableau vide
    if (!user.favRecipes.length) {
      res.json({ result: true, bookmarks: [] });
      return;
    }

    // Récupérer toutes les recettes favorites
    const { Recipe } = require("../models/recipes");
    Recipe.find({ _id: { $in: user.favRecipes } })
      .select("title description regime category averageNote voteNr difficulty duration cost")
      .then((recipes) => {
        res.json({ result: true, bookmarks: recipes });
      })
      .catch((error) => {
        res.json({ result: false, error: error.message });
      });
  });
});

router.post("/regimes", (req, res) => {
  // Vérifier que tous les champs requis sont présents
  if (!checkBody(req.body, ["token", "regime"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ token: req.body.token }).then((user) => {
    if (!user) {
      res.json({ result: false, error: "User not found" });
      return;
    }

    // Vérifier si le régime est déjà dans les favoris
    if (user.regime.includes(req.body.regime)) {
      res.json({ result: false, error: "Regime already in favorites" });
      return;
    }

    User.updateOne(
      { token: req.body.token },
      { $push: { regime: req.body.regime } }
    ).then(() => {
      res.json({ result: true, regimes: [...user.regime, req.body.regime] });
    });
  });
});

// Route pour retirer un régime des favoris
router.delete("/regimes", (req, res) => {
  // Vérifier que tous les champs requis sont présents
  if (!checkBody(req.body, ["token", "regime"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  // Rechercher l'utilisateur par son token
  User.findOne({ token: req.body.token }).then((user) => {
    if (!user) {
      res.json({ result: false, error: "User not found" });
      return;
    }

    // Vérifier si le régime est dans les favoris
    if (!user.regime.includes(req.body.regime)) {
      res.json({ result: false, error: "Regime not in regimes" });
      return;
    }

    // Retirer le régime des favoris
    User.updateOne(
      { token: req.body.token },
      { $pull: { regime: req.body.regime } }
    ).then(() => {
      const updatedregimes= user.regime.filter(
        (id) => id !== req.body.regime
      );
      res.json({ result: true, regimes: updatedregimes });
    });
  });
});

// Route pour récupérer toutes les régimes favorites d'un utilisateur
router.get("/regimes/:token", (req, res) => {
  User.findOne({ token: req.params.token }).then((user) => {
    if (!user) {
      res.json({ result: false, error: "User not found" });
      return;
    }
    // Si l'utilisateur n'a pas de regime, retourner un tableau vide
    if (!user.regime.length) {
      res.json({ result: true, regimes : [] });
      return;
    }
    else {
      res.json({result: true, regimes : user.regime})
    }
  });
});

module.exports = router;

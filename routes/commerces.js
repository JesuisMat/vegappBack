var express = require("express");
var router = express.Router();
const IngredientCpf = require("../models/ingredientsCpf");
const User = require("../models/users");

router.post("/ingredientsCpf", async (req, res) => {
  try {
    const regex = new RegExp(req.body.nom, "i");
    const data = await IngredientCpf.find({ nom: { $regex: regex } });
    console.log(req.body)
    if (data.length > 0) {
      const formattedData = data.map((item) => ({
        id: item.code, // No modification, just renaming the key
        title: item.nom, // No modification, just renaming the key
      }));

      res.json({ result: true, ingredients: formattedData });
    } else {
      res.json({ result: false, error: "Aucun ingrédient trouvé" });
    }
  } catch (error) {
    res.status(500).json({ result: false, error: "Erreur de BDD", details: error.message });
  }
});

// Route pour ajouter un commerce aux favoris
router.post("/business/bookmark", (req, res) => {
  // Vérifier que tous les champs requis sont présents
  if (!checkBody(req.body, ["token", "business"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  const { token, business } = req.body;

  // Rechercher l'utilisateur par son token
  User.findOne({ token }).then((user) => {
    if (!user) {
      res.json({ result: false, error: "User not found" });
      return;
    }

    // Vérifier si le commerce est déjà dans les favoris (par son SIRET)
    const alreadyInFavorites = user.favBuisnesses.some(
      (item) => item.siret === business.siret
    );

    if (alreadyInFavorites) {
      res.json({ result: false, error: "Business already in favorites" });
      return;
    }

    // Ajouter le commerce complet aux favoris
    User.updateOne(
      { token },
      { $push: { favBuisnesses: business } }
    ).then(() => {
      res.json({ 
        result: true, 
        favBuisnesses: [...user.favBuisnesses, business] 
      });
    });
  });
});

// Route pour retirer un commerce des favoris
router.delete("/business/bookmark", (req, res) => {
  // Vérifier que tous les champs requis sont présents
  if (!checkBody(req.body, ["token", "siret"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  const { token, siret } = req.body;

  // Rechercher l'utilisateur par son token
  User.findOne({ token }).then((user) => {
    if (!user) {
      res.json({ result: false, error: "User not found" });
      return;
    }

    // Vérifier si le commerce est dans les favoris
    const businessIndex = user.favBuisnesses.findIndex(
      (business) => business.siret === siret
    );

    if (businessIndex === -1) {
      res.json({ result: false, error: "Business not in favorites" });
      return;
    }

    // Retirer le commerce des favoris
    User.updateOne(
      { token },
      { $pull: { favBuisnesses: { siret: siret } } }
    ).then(() => {
      const updatedFavBuisnesses = user.favBuisnesses.filter(
        (business) => business.siret !== siret
      );
      res.json({ result: true, favBuisnesses: updatedFavBuisnesses });
    });
  });
});

// Route pour récupérer tous les commerces favoris d'un utilisateur
router.get("/business/bookmarks/:token", (req, res) => {
  User.findOne({ token: req.params.token }).then((user) => {
    if (!user) {
      res.json({ result: false, error: "User not found" });
      return;
    }

    // Retourner directement la liste des commerces favoris
    res.json({ 
      result: true, 
      bookmarks: user.favBuisnesses || [] 
    });
  });
});

module.exports = router;

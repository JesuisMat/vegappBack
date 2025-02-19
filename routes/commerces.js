var express = require("express");
var router = express.Router();
const IngredientCpf = require("../models/ingredientsCpf");

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

module.exports = router;

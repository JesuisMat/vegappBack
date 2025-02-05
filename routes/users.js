var express = require('express');
var router = express.Router();

require('../models/connection');
const User = require('../models/users');
const { checkBody } = require('../modules/checkBody');
const uid2 = require('uid2');
const bcrypt = require('bcrypt');

// route pour créér un.e utilisateur.ice
router.post('/signup', (req, res) => {
  // utilisation du module checkBody pour vérifier que tous les champs ont bien été renseignés
  if (!checkBody(req.body, ['username', 'password'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }
  // on regarde si l'utilisateur.ice est déjà en BDD
  User.findOne({ username: req.body.username }).then(data => {
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
        regime: []
      });
      // on le save et on renvoie un json avec le result et le token user
      newUser.save().then(newDoc => {
        res.json({ result: true, token: newDoc.token });
      });
    } else {
      // si l'utilisateur existe déjà on renvoie un json avec result : false avec message erreur
      res.json({ result: false, error: 'User already exists' });
    }
  });
});

// route pour se connecter à son compte utilisateur.ice
router.post('/signin', (req, res) => {
  // utilisation du module checkBody pour vérifier que tous les champs ont bien été renseignés
  if (!checkBody(req.body, ['username', 'password'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }
  // on regarde si l'utilisateur.ice est déjà en BDD
  User.findOne({ username: req.body.username }).then(data => {
    // on compare le mot de passe reçu avec celui enregistré en base de données via la méthode compareSync
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      // on récupère le token pour le stocker ensuite dans le reducer (le token sert à identifier l'utilisateur, le token peut être regénéré contrairement à l'id)
      res.json({ result: true, token: data.token });
    } else {
      // si mauvais mot de passe on renvoie un json avec result : false avec message erreur
      res.json({ result: false, error: 'User not found or wrong password' });
    }
  });
});

module.exports = router;

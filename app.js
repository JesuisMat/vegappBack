var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('./models/connection');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var recettesRouter = require('./routes/recettes');
var commercesRouter = require('./routes/commerces');
var app = express();
const cors = require('cors');
app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/recettes', recettesRouter);
app.use('/commerces', commercesRouter);

module.exports = app;

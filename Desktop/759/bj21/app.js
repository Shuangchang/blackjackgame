var createError = require('http-errors');
var express = require('express');
var flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
var request = require('request');
var session = require('express-session');
var crypto = require('crypto');
const uuidv4 = require('uuid/v4');
var path = require('path');
const sequelize = require('./routes/db');
const chatServer = require('./routes/chat');
const gameServer = require('./routes/game');
var models = require("./models");
const User = require('./models/User')(sequelize);
const bcrypt = require('bcrypt');
var port = process.env.PORT;
if (port === null || port === "") {
    port = 3000;
}
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const app = express();
app.set('trust proxy', 1);
app.use(session({
        genid:function(req){
            return crypto.createHash('sha256').update(uuidv4()).update(crypto.randomBytes(256)).digest("hex");
        },
        secret: 'it is randomwhatdoyoumean',
        store: sequelize.myStore,
        resave:false,
        saveUninitialized:true
    })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next) {
    res.locals.user = req.user;
    next();
});

app.use(flash());

// view engine setup
app.set('views', path.join(__dirname, 'client'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'client')));

const passportConfig = require('./routes/app-passport')(passport,User,LocalStrategy,bcrypt);

//Sync Database
models.sequelize.sync().then(function() {
    console.log('Nice! Database looks fine')

}).catch(function(err) {
    console.log(err, "Something went wrong with the Database Update!")

});

const AppRouter = require('./routes/app-router');
new AppRouter(app,passportConfig);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(port);

module.exports = app;

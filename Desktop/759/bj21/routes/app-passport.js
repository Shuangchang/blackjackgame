// const passport = require('passport');
// const LocalStrategy = require('passport-local').Strategy;
// const User = require('../models/User')();
//
module.exports = function(passport, user, localStrategy, bcrypt){
    console.log("in app psprt")
    var User = user;

    var LocalStrategy = localStrategy;

    passport.use(new LocalStrategy(
        (username, password, done) => {
            User.findOne({where:{username: username}})
                .then( (User) => {
                    if (!User) {
                        return done(null, false, {msg: 'Incorrect login info.'});
                    }
                    let result = bcrypt.compareSync(password, User.password);
                    console.log("result",result);
                    if(result){
                        console.log("login success");
                        return done(null, User);
                    }else {
                        console.log("login failed");
                        return done(null, false, { message: 'Incorrect login.' });
                    }

                })
              // .catch(err => done(err));
        }));

    passport.serializeUser(function(user, done) {
        return done(null, user.id);
    });
    passport.deserializeUser(function(id, done) {
        User.findById(id).then(function(user) {
            // console.log(user);
            return done(null, user);
        });
    });

    return passport;
}

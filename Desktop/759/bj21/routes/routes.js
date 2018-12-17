// var express = require('express');
// var app = express();
// var passport = require('passport');
// var request = require('request');
// const { Pool, Client } = require('pg');
// const bcrypt = require('bcrypt');
// const uuidv4 = require('uuid/v4');
// const LocalStrategy = require('passport-local').Strategy;
// const pool = new Pool({
//     user: process.env.PGUSER,
//     host: process.env.PGHOST,
//     database: process.env.PGDATABASE,
//     password: process.env.PGPASSWORD,
//     port: process.env.PGPORT,
//     ssl: true
// });
//
// app.use(express.static('public'));
//
// // app.get('/singup', function (req, res, next) {
// //     res.render('singup', {
// //         title: "singup",
// //         userData: req.user,
// //         messages: {
// //             danger: req.flash('danger'),
// //             warning: req.flash('warning'),
// //             success: req.flash('success')
// //         }
// //     });
// // });
//
// app.post('/singup', async function (req, res) {
//
//     try{
//         const client = await pool.connect();
//         await client.query('BEGIN');
//         var pwd = await bcrypt.hash(req.body.password, 5);
//         await JSON.stringify(client.query('SELECT id FROM "users" WHERE "usrnm"=$1', [req.body.username], function(err, result) {
//         if(result.rows[0]){
//             req.flash('warning', "User exists. <a href='/login'>Log in!</a>");
//             res.redirect('/singup');
//         }
//         else{
//             client.query('INSERT INTO users (id, "usrnm", password) VALUES ($1, $2, $3)', [uuidv4(), req.body.username, pwd], function(err, result) {
//                 if(err){console.log(err);}
//                 else {
//                     client.query('COMMIT')
//                     console.log(result)
//                     req.flash('success','User created.')
//                     res.redirect('/login');
//                     return;
//                 }
//             });
//
//
//         }
//
//     }));
//     client.release();
//     }
//     catch(e){throw(e)}
// });
//
// app.get('/login', function (req, res, next) {
//     if (req.isAuthenticated()) {
//         res.redirect('/account');
//     }
//     else{
//         res.render('login', {
//             title: "Log in",
//             userData: req.user,
//             messages: {
//                 danger: req.flash('danger'),
//                 warning: req.flash('warning'),
//                 success: req.flash('success')
//             }
//         });
//     }
// });
// //http://www.passportjs.org/docs/
// app.post('/login', passport.authenticate('local', {
//         successRedirect: '/account',
//         failureRedirect: '/login',
//         failureFlash: true
//     }), function(req, res) {
//     if (req.body.remember) {
//         req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // Cookie expires after 1 day
//     } else {
//         req.session.cookie.expires = false; // Cookie expires at end of session
//     }
//     res.redirect('/');
// });
//
// app.get('/logout', function(req, res){
//
//     console.log(req.isAuthenticated());
//     req.logout();
//     console.log(req.isAuthenticated());
//     req.flash('success', "Bye!");
//     res.redirect('/');
// });
//
// passport.use('local', new LocalStrategy({passReqToCallback : true},
//     (req, username, password, done) => {
//         loginAttempt();
//         async function loginAttempt() {
//             const client = await pool.connect();
//             try{
//                 await client.query('BEGIN');
//                 var getUser = await JSON.stringify(client.query('SELECT id, "usrnm", FROM "users" ' +
//                     'WHERE "usrnm"=$1', [username], function(err, result) {
//
//                     if(err) {
//                         return done(err)
//                     }
//                     if(result.rows[0] == null){
//                         req.flash('danger', "Something is wrong.");
//                         return done(null, false);
//                     }
//                     else{
//                         bcrypt.compare(password, result.rows[0].password, function(err, check) {
//                             if (err){
//                                 console.log('Error while checking password');
//                                 return done();
//                             }
//                             else if (check){
//                                 return done(null, [{username: result.rows[0].usrnm}]);
//                             }
//                             else{
//                                 req.flash('danger', "Oops. Incorrect login details.");
//                                 return done(null, false);
//                             }
//                         });
//                     }
//                 }))
//             }
//
//             catch(e){throw (e);}
//         };
//
//     }
// ))
// passport.serializeUser(function(user, done) {
//     done(null, user);
// });
// passport.deserializeUser(function(user, done) {
//     done(null, user);
// });
//
//
// module.exports = app;

const sequelize = require('../routes/db');
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const uuidv4 = require('uuid/v4');
const auth = require('./auth');

const User = require('../models/User')(sequelize);
const Game = require('../models/Game')(sequelize);
const Player = require('../models/Player')(sequelize);
const Chat = require('../models/Chat')(sequelize);
const Card = require('../models/Card')(sequelize);

const Deck = require('./deck');
class AppRouter {
    constructor(app, passport) {
        this.app = app;
        this.passport = passport;
        this.setupRouters();
    }

    setupRouters() {
        const app = this.app;
        const passport = this.passport;

        /**** FRONTEND ENDPOINTS  */
        app.get('/', (req, res) => {
            return res.redirect('/login');
        });

        app.get('/login', (req, res, next) => {
            if (req.user) return res.redirect('/lobby');
            res.render('index.html');
        });

        app.get('/signup', (req, res, next) => {
            res.render('signup.html');
        });

        app.get('/joinGame/:gameid', (req, res, next) => {
            if (!req.user) return res.redirect('/lobby');
            res.cookie('gameid',req.params.gameid);
            res.render('game.html');
        });

        app.get('/lobby', (req, res, next) => {
            if (req.user)
                res.render('lobby.html');
            else  return res.redirect('/login');
        });
        app.get('/error', (req, res, next) => {
            res.render('error.html');
        });

        /**** API ENDPOINTS */

        /* Login via json post */
        app.post('/api/login', function (req, res, next) {
            console.log("api/login");
            /* If no body, it is via get request and body should be set to
            query string */
            if (Object.keys(req.body).length === 0) req.body = req.query;

            passport.authenticate('local',function (err, user, info) {
                if (err) { return next(err); }
                if (!user) { return res.redirect('../login'); }
                req.logIn(user, function(err) {
                    console.log("in logIn", err)
                    if (err) { return next(err); }
                    res.cookie('username',auth.getUserName(user.username));
                    res.cookie('sessionid',req.sessionID);
                    res.cookie('userid',user.id);
                    res.user = user;
                    return res.redirect('../lobby');
                });
            })(req, res, next);
        });

        app.post('/api/signup',
            function (req, res, next) {
                // const errors = validationResult(req);
                // if (!errors.isEmpty()) {
                //     return res.status(422).json({ errors: errors.array() });
                // }

                console.log("api/signup");
                let salt = bcrypt.hashSync(req.cookies.cname + req.headers['user-agent'], 10);
                let hash = bcrypt.hashSync(req.body.password,10);
                console.log("in bcrypt");
                User.findOrCreate({where: {username: req.body.username},
                    defaults: {
                        id: uuidv4(),
                        username: req.body.username,
                        password: hash,
                        pswd_salt:salt }})
                    .spread((user, created) => {
                        console.log(res.headersSent);
                        if(!created){
                            console.log("Did not signup")
                        }else{
                            console.log("go to login")
                            res.status(200).json({
                                user
                            });
                        }
                    })
        });

        app.post('/api/logout', function (req, res, next) {
            console.log("api/logout");
            console.log(req.body);
        });

        app.post('/api/createGame', function (req, res, next) {
            let player = req.user.id;
            let username = req.user.username;
            let gameid = req.body.gameid;
            if(player === gameid){
                Game.findOrCreate({where:{ id:gameid },
                    defaults:{
                        id:gameid
                    }})
                    .then((game)=>{
                        Player.destroy({where:{gameid:game.id}})
                            .then(()=>{
                                Player.findOrCreate({where:{id:player, gameid:gameid},
                                    defaults:{
                                        id:player,
                                        playername:username,
                                        gameid:game.id
                                    }
                                }).then((Player)=>{
                                    console.log("game created")
                                    return res.send(Player);
                                })
                            })
                    })
            }
        });

        app.post('/api/getOwner', function (req, res, next) {
            let player = req.user.id;
            let username = req.user.username;
            let gameid = req.body.gameid;
            Player.findOne({where:{id:gameid, gameid:gameid}})
                 .then((Player)=>{
                    console.log("Owner found.")
                    return res.send(Player);
            })
        });
        app.post('/api/readyToPlay', function (req, res, next) {
            console.log("ready to play");
            let player = req.user.id;
            let gameid = req.body.gameid;
            // console.log(player);
            // console.log(gameid);
            if(gameid !== player){
            Game.findOne({
                where: { id: gameid}})
                .then((Game)=>{
                    User.findOne({where: {id: player}})
                        .then((User)=>{
                            Player.findOrCreate({where:{id:player, gameid:gameid},
                                defaults:{
                                    id:player,
                                    playername:User.username,
                                    gameid:gameid
                                }})
                                .then((Player)=>{
                                    console.log("player added");
                                    res.send(Player);
                                })
                        })
                });
            }
        });

        app.post('/api/getActiveGames', function (req, res, next) {
            console.log("getActiveGames");
            Game.findAll()
                .then((games)=>{
                    if(games.length>0){
                        let gameids = [];
                        games.forEach((game)=>{
                            gameids.push(game.id);
                        });
                        Player.findAll({where:{gameid:gameids, id:gameids}})
                            .then((players)=>{
                                return res.send(players);
                            })
                    }else {
                        return res.send("no game found.");
                    }

                })
        });

        app.post('/api/removeGame', function (req, res, next) {
            console.log("removeGame");
            Player.destroy({where:{gameid:req.user.id}});
            Card.destroy({where:{game:req.user.id}});
            Game.destroy({where:{id:req.user.id}});
            return res.send(req.user.id);
        });

        app.post('/api/getAllChats', function (req, res, next) {
            console.log("getAllChats");
            const Op = sequelize.Sequelize.Op;
            Chat.findAll({where:{createdAt: {
                        [Op.lt]: new Date(),
                        [Op.gt]: new Date(new Date() - 24 * 60 * 60 * 1000)
                    }}})
                .then((chats)=>{
                    let userids = [];
                    chats.forEach((chat)=>{
                        userids.push(chat.userid);
                    });
                    let uniqUserids = [...new Set(userids)];
                    User.findAll({where:{id:uniqUserids}})
                        .then((users)=>{
                            return res.send(users);
                        })
                })
        })
        app.post('/api/saveChat', function (req, res, next) {
            console.log("saveChat");
            Chat.findOrCreate({where:{userid:req.user.id, message:req.body.message},
                defaults:{
                    id:uuidv4(),
                    userid:req.user.id,
                    message:req.body.message
                }})
        })
    }
}

module.exports = AppRouter;


const sequelize = require('../routes/db');
const bcrypt = require('bcrypt');
const uuidv4 = require('uuid/v4');
const Player = require('../models/Player')(sequelize);
const Card = require('../models/Card')(sequelize);
const Game = require('../models/Game')(sequelize);

const Deck = require('./deck');
const WebSocket = require('ws'),
    wss1 = new WebSocket.Server({port: 8080});
const cookieParser = require('cookie-parser');

let clients = [ ];// list of currently connected clients (users)
let index = clients.push(wss1) - 1;

let playerList = [ ];

let trackTurn = [ ];

let losePlayerList = [ ]; // acceded 21

let userName = false;

wss1.on('connection', function (ws,request) {
    console.log("in 8080 connection");
    console.log(request.url);
    ws.on('message', function (message) {
        console.log('received: %s', message)
        let jsonMessage;
        try {
            jsonMessage = JSON.parse(message);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message);
            return;
        }
        // if(jsonMessage.data && !playerList.includes(jsonMessage.data)){
        //     playerList.push(jsonMessage.data);
        // }
        // remember user name
        userName = getUsername(request.url);

        if(jsonMessage.type === "message"){

        }else if(jsonMessage.type === "getTurn"){
            let gameid = jsonMessage.gameid;
            let current;
            trackTurn.forEach((player)=>{
                console.log("who's turn: ", player);
                if(player.gameid === gameid){
                    current = player;
                    wss1.broadcast(JSON.stringify({gameid:gameid, type:'turn',data: player}));
                }
            })
            if(!current){
                 console.log("turn end, show cards");
                 Player.findOne({where:{gameid:gameid, playername:'dealer'}})
                     .then((player)=>{
                         Card.findAll({where:{game:gameid, playerid: player.id}})
                            .then((cards)=>{
                                ws.send(JSON.stringify({
                                    type: 'dealerCards',
                                    gameid: gameid,
                                    data: cards
                                }));
                                wss1.broadcast(JSON.stringify({gameid:gameid, type:'roundEnd'}));
                        })
                    })

            }
        }
        // else if(jsonMessage.type==="reset"){
        //
        //     wss1.broadcast(JSON.stringify({gameid:gameid, type:'roundEnd'}))
        // }
        else if(jsonMessage.type==="hit"){
            let gameid = jsonMessage.gameid;
            let playerid = jsonMessage.playerid;
            Player.findOne({where:{id:playerid}})
                .then((player)=>{
                    Card.count({where:{gameid:gameid,playerid:null}})
                        .then((count)=>{
                        if(count===0){
                            let deck = new Deck();
                            deck.shuffle();
                            deck.deck.forEach((d,i)=>{
                                d.id = i;
                                d.game = gameid;
                            });
                            Card.destroy({where:{game:gameid}})
                                .then((affectedRows)=>{
                                    if(affectedRows === 52) {
                                        Card.bulkCreate(deck.deck, {fields: ['id', 'cardValue', 'cardSuit', 'game']})
                                            .then((cards) => {
                                                Card.findOne({where:{game: gameid, playerid: null}})
                                                    .then((card)=>{
                                                        card.playerid = playerid;
                                                        card.save().then(()=>{
                                                            let obj = {
                                                                player: player,
                                                                cards: card,
                                                                gameid: gameid
                                                            }

                                                            wss1.broadcast(JSON.stringify({
                                                                type: 'getCard',
                                                                gameid: gameid,
                                                                data: obj
                                                            }));
                                                            updateTurn(gameid,playerid);
                                                        })
                                                    })
                                            })
                                    }})
                        }else{
                            Card.findOne({where:{game: gameid, playerid: null}})
                                .then((card)=>{
                                    card.playerid = playerid;
                                    card.save().then(()=>{
                                        let obj = {
                                            player: player,
                                            cards: card,
                                            gameid: gameid
                                        }

                                        wss1.broadcast(JSON.stringify({
                                            type: 'getCard',
                                            gameid: gameid,
                                            data: obj
                                        }));
                                        updateTurn(gameid,playerid);
                                    })
                                })
                        }
                    })

                })
        }
        else if(jsonMessage.type === "dealerTurn"){
            console.log("dealerTurn")
            let gameid = jsonMessage.gameid;
            Player.findOne({where:{gameid:gameid, playername:'dealer'}})
                .then((player)=>{
                    console.log("dealer id ",player.id);
                    Card.findAll({where:{game:gameid,playerid:player.id}})
                        .then((cards)=>{
                            let values = [ ];
                            for(let i=0; i < cards.length; i++){
                                values.push(parseInt(cards[i].cardValue));
                            }
                            let totalValue = getTotal(values);
                            console.log("dealer total", totalValue);
                            if(totalValue<17){
                                Card.findOne({where:{game:gameid,playerid:null}})
                                    .then((card)=>{
                                        card.playerid = player.id;
                                        card.save()
                                            .then((card)=>{
                                                totalValue += parseInt(card.cardValue);
                                                console.log("new dealer score: ", totalValue);
                                                if(totalValue<17){
                                                    console.log("new dealer score < 17 ", totalValue);
                                                    wss1.broadcast(JSON.stringify({
                                                        type: 'dealerHit',
                                                        gameid: gameid,
                                                        playerid: card.playerid
                                                    }));
                                                    // track turn
                                                    updateTurn(gameid,card.playerid);
                                                }else{
                                                    console.log("new dealer score >17: ", totalValue);
                                                    for(let i=0; i<playerList.length; i++){
                                                        if(playerList[i].gameid === gameid && playerList[i].playername === 'dealer'){
                                                            playerList[i].status = "stand";
                                                            break;
                                                        }
                                                    }
                                                    wss1.broadcast(JSON.stringify({
                                                        type: 'dealerStand',
                                                        gameid: gameid,
                                                        playerid: card.playerid
                                                    }));
                                                    // track turn
                                                    updateTurn(gameid,card.playerid);
                                                }
                                        })
                                    })
                            }
                            else {
                                for(let i=0; i<playerList.length; i++){
                                    if(playerList[i].gameid === gameid && playerList[i].playername === 'dealer'){
                                        playerList[i].status = "stand";
                                        break;
                                    }
                                }
                                wss1.broadcast(JSON.stringify({
                                    type: 'dealerStand',
                                    gameid: gameid,
                                    playerid: player.id
                                }));
                                // track turn
                                updateTurn(gameid,player.id);
                            }
                        })
                })
        }
        else if(jsonMessage.type === "stand"){
            console.log("stand");
            let gameid = jsonMessage.gameid;
            let playerid = jsonMessage.playerid;
            for(let i=0; i< playerList.length; i++){
                //if dealer stand
                console.log(playerList[i]);
                if(playerList[i].gameid === gameid &&
                    playerList[i].playername ==='dealer' && playerList[i].status){
                    console.log("dealer and player both stand")
                    let dealerid = playerList[i].id;
                    Card.findAll({where:{game:gameid, playerid:dealerid}})
                        .then((cards)=>{
                            ws.send(JSON.stringify({
                                type: 'dealerCards',
                                gameid: gameid,
                                data: cards
                            }));

                            updateTurn(gameid,playerid);
                         })
                }
                if(playerList[i].gameid === gameid && playerList[i].id === playerid){
                    console.log("player stand");
                    playerList[i].status = "stand";
                    console.log(playerList)
                    wss1.broadcast(JSON.stringify({
                        type: 'playerStand',
                        gameid: gameid,
                        data: playerList[i]
                    }))
                    updateTurn(gameid,playerid);
                }
            }

        }
        else if(jsonMessage.type === "playerRoundEnd"){
            let gameid = jsonMessage.gameid;
            let playerid = jsonMessage.playerid;
            let playerindex = 0;
            for(let i=0; i<playerList.length; i++){
               if(playerList[i].gameid === gameid && playerList[i].id === playerid){
                    playerList[i].status = "stand";
                    playerindex = i;
                    break;
                }
            }
            for(let i=0; i < playerList.length; i++){
                if(playerList[i].gameid === gameid &&
                    playerList[i].playername ==='dealer' && playerList[i].status){
                    console.log("dealer and player both stand");
                    let dealerid = playerList[i].id;
                    Card.findAll({where:{game:gameid, playerid:dealerid}})
                        .then((cards)=>{
                            ws.send(JSON.stringify({
                                type: 'dealerCards',
                                gameid: gameid,
                                data: cards
                            }));
                            updateTurn(gameid,playerid);
                        })
                }
            }
            updateTurn(gameid,playerid);
        }
        else if(jsonMessage.type === "playerJoined"){
            let json = JSON.stringify(jsonMessage);
            wss1.broadcast(json);
        }
        else if(jsonMessage.type === "win"){
            let json = JSON.stringify(jsonMessage);
            wss1.broadcast(json);
        }
        else if(jsonMessage.type === "lose"){
            let json = JSON.stringify(jsonMessage);
            wss1.broadcast(json);
        }
        else if(jsonMessage.type === "gameEnd"){
            let gameid = jsonMessage.gameid;
            let json = JSON.stringify(jsonMessage);
            wss1.broadcast(json);
            Player.destroy({where:{gameid:gameid}});
            Card.destroy({where:{game:gameid}});
            Game.destroy({where:{id:gameid}});
        }
        else if(jsonMessage.type === "playerLeaveGame"){
            console.log("playerLeaveGame")
            let gameid = jsonMessage.gameid;
            let playerid = jsonMessage.playerid;
            let index = 0;
            for(let i=0; i<playerList.length; i++){
                if(playerList[i].gameid === gameid && playerList[i].id === playerid){
                    index = i;
                    break;
                }
            }
            for(let i=0; i<trackTurn.length; i++){
                if(trackTurn[i].gameid === gameid && trackTurn[i].id === playerid){
                    updateTurn(gameid,playerid);
                    break;
                }
            }
            playerList.splice(index,1);
            removePlayer(gameid,playerid);
            releaseCards(gameid,playerid);

            wss1.broadcast(JSON.stringify({
                type: 'playerRemoved',
                gameid: gameid,
                playerid: playerid
            }));
        }
        else if(jsonMessage.type === "createGame"){
            console.log("createGame");
            let gameid = jsonMessage.gameid;
            releaseAllCards(gameid);
            clearList(playerList,gameid);
            // console.log('playerList',playerList);
            clearList(trackTurn,gameid);
            // console.log('trackTurn',trackTurn);
            Player.findOrCreate({where:{gameid:gameid, playername:'dealer'},
                defaults:{
                    id:uuidv4(),
                    playername:'dealer',
                    gameid:gameid
                }})
                .then(()=>{
                    return Player.findAll({where:{gameid:gameid}})})
                .then((players)=>{
                    players.forEach((player)=>{
                        playerList.push({
                            id:player.id,
                            playername:player.playername,
                            gameid:player.gameid
                        })
                    });
                    console.log("playerlist ",playerList)
                    //keep track turn
                    trackTurn.push({
                        id:players[0].id,
                        playername:players[0].playername,
                        gameid:players[0].gameid
                    });

                    let deck = new Deck(gameid);
                    deck.shuffle();

                    Card.findAndCountAll({where:{game:gameid}})
                        .then((result)=>{
                            if(result.count !== 0){
                                return Card.destroy({where:{game:gameid}})
                                    .then(()=>{
                                        Card.bulkCreate(deck.deck,{fields:['id','cardValue','cardSuit','playerid','game']})
                                            .then((cards)=>{
                                            console.log("in delete then bulkcreate",cards.length);
                                            let index = 0;
                                            while(index<players.length*2){
                                                for(let i = 0; i<players.length; i++) {
                                                    cards[index].playerid = players[i].id;
                                                    cards[index].save().then((card) => {
                                                        let obj = {
                                                            player: players[i],
                                                            cards: card,
                                                            gameid: gameid
                                                        }
                                                        wss1.broadcast(JSON.stringify({
                                                            type: 'deal',
                                                            gameid: gameid,
                                                            data: obj
                                                        }))
                                                    })
                                                    index++;
                                                }
                                            }
                                        })
                                })
                            }else {
                                Card.bulkCreate(deck.deck,{fields:['id','cardValue','cardSuit','playerid','game']})
                                    .then((cards)=>{
                                        console.log("in bulkcreate",cards.length);
                                        let index = 0;
                                        while(index<players.length*2){
                                            for(let i = 0; i<players.length; i++) {
                                                cards[index].playerid = players[i].id;
                                                cards[index].save().then((card) => {
                                                    let obj = {
                                                        player: players[i],
                                                        cards: card,
                                                        gameid: gameid
                                                    }
                                                    wss1.broadcast(JSON.stringify({
                                                        type: 'deal',
                                                        gameid: gameid,
                                                        data: obj
                                                    }))
                                                })
                                                index++;
                                            }
                                        }
                                    })
                            }
                        })
                })
        }

    })

    // setInterval(
    //     () => ws.send(`${new Date()}`),
    //     1000
    // )

    ws.on('close', function(connection) {
        console.log("connection close");
        console.log("connection close");
        if (userName !== false) {
            console.log(connection)
            console.log((new Date()) + " Peer "
                + userName  +  " disconnected.");
            // remove user from the list of connected clients
            clients.splice(index, 1);

            let playerid;
            let gameid;
            // remove user from player table and playerlist
            playerList.forEach((player, index)=>{
                if(player.playername === userName){
                    playerid = player.id;
                    gameid = player.gameid;
                    removePlayer(gameid,playerid);
                    playerList.splice(index,1);
                }
            });
            if(playerid && gameid){
                releaseCards(gameid,playerid);
                Player.destroy({where:{gameid:json.gameid, id:playerid}});

                if(playerid === gameid){
                    Player.destroy({where:{gameid:json.gameid}});
                    Card.destroy({where:{game:json.gameid}});
                    Game.destroy({where:{id:json.gameid}});
                }
            }

        }
    });
});

// wss.on('connection', function connection(ws) {
//     ws.on('message', function incoming(message) {
//         console.log('received: %s', message);
//     });
//
//     ws.send('something');
// });

wss1.broadcast = function broadcast(data) {
    wss1.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getUsername(url) {
    let index = url.indexOf("=");
    return url.substring(index+1,url.length);
}

function getUniqValues(all) {
    return [...new Set(all)];
}

function updateTurn(gameid, playerid) {
    console.log("update Turn");
    let playersInGame = [];
    playerList.forEach((player)=>{
       if(player.gameid === gameid){
           playersInGame.push(player);
       }
    });
    let index = 99;
    for(let i = 0 ; i < playersInGame.length; i++){
        if(playersInGame[i].id === playerid ){
            index = (i === playersInGame.length-1) ? 0:(i+1);
            if(playersInGame[index].status){
                console.log(playersInGame[index]);
                index = 99;
                break;
            }
        }
    }
    console.log("index", index);
    if(index === 99){// all stand
        for (let i=0; i<trackTurn.length;i++){
            console.log("remove trackTurn", trackTurn);
            if( trackTurn[i].gameid === gameid ){
                trackTurn.splice(i,1);
                console.log(trackTurn)
                break;
            }
        }
    }else {
        for (let i=0; i<trackTurn.length;i++){
            console.log("update trackTurn", trackTurn);
            if( trackTurn[i].gameid === gameid ){
                trackTurn[i] = playersInGame[index];
                console.log(trackTurn)
                break;
            }
        }
    }
}

function clearList(originList,gameid) {
    originList.reduce(function(list, player, index) {
        if (player.gameid === gameid) list.push(index);
        return list;
    }, []).reverse().forEach(function(index) {
        originList.splice(index,1);
    });
}


function removePlayer(gameid, playerid) {
    Player.findOne({where:{gameid:gameid, id:playerid}})
        .then((player)=>{
            return player.destroy;
        })
}

function releaseCards(gameid, playerid) {
    Card.update({playerid:null},{where:{game:gameid,playerid:playerid}})
        .spread((affectedCount, affectedRows) => {

            console.log("affectedCount ", affectedCount);
            console.log("affectedRows ", affectedRows);
        })
}
function releaseAllCards(gameid) {
    Card.update({playerid:null},{where:{game:gameid}})
        .spread((affectedCount, affectedRows) => {
            console.log("affectedCount ", affectedCount);
            console.log("affectedRows ", affectedRows);
        })
}

function getTotal(values) {
    var total = 0;
    let ace = false;
    for (let i = 0; i < values.length; i++) {
        total += Math.min(10, values[i]);
        if (values[i] === 1)
            ace = true;
    }
    if ((total + 10) <= 21 && ace){
        total += 10;
    }

    console.log("total dealer: ", total);
    return total;
}

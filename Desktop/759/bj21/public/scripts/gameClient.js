var dealerCards = [];  // Arrays holding the DisplayCard objects used to show the cards
var playerCards = [];
var players = []; // all other players

dealerCards.count = 0;  // Number of cards actually in the dealer's hand
playerCards.count = 0;   // Number of cards actually in the player's hand
players.count = 0;

// var deck = new Deck();

var gameInProgress = false;
var roundInProgress = false;
var dealerMsg = false;
var ifShowDealerCards = false;
var winOrLose = false;

var betDiv = $("#betDiv");
var myScoreDiv = $("#myScore");
var dealerDiv = $("#dealer");
var otherPlayer = $("#otherPlayer");
var message;

var hit, stand;  // objects representing the buttons, so I can enable/disable them

let createUrlParam = ()=>{
    return 'ws://localhost:8080?username='+getCookie("username");
}
const ws = new WebSocket(createUrlParam());
// event emmited when connected
let gameid = getCookie('gameid');
let userid = getCookie('userid');
ws.onopen = function () {
    $(".alert").hide();
    console.log('websocket is connected, waiting for players ...')
    if(gameid === userid){
        $("#startGameBtn").show();
        $("#readyBtn").hide();
    }else{
        $("#startGameBtn").hide();
        $("#readyBtn").show();
    }
    ws.send('enter game');
}
ws.onclose = function (){
    if(gameid === userid){
        ws.send(JSON.stringify({gameid:gameid, type:'gameEnd' ,playerid:userid}));
    }else{
        ws.send(JSON.stringify({gameid:gameid, type:'playerLeaveGame' ,playerid:userid}));
    }
}
ws.onerror = function(err){
    content.html($('<p>', { text: 'Sorry, but there\'s some problem with your '
            + 'connection or the server is down.' } ));
}
// event emmited when receiving message
ws.onmessage = function (ev) {
    console.log(ev.data);
    try {
        var json = JSON.parse(ev.data);
    } catch (e) {
        console.log('This doesn\'t look like a valid JSON: ', ev.data);
        return;
    }
    if (json.gameid === gameid) {
        if (json.type === 'playerJoined') { // first response from the server with user's color
            players.push(json.data);
            updateMsg(`${getUsername(json.data.playername)} is ready. `);
            if(userid !==json.data.id){
                otherPlayer.append(`<div class="otherPlayerName" id="${json.data.id}">${getUsername(json.data.playername)}</div>`);
            }
            $("#startGameBtn").prop("disabled",false);
            // from now user can start sending messages
        } else if (json.type === 'deal') { //
            roundInProgress = true;
            $("#startGameBtn").prop("disabled",true);
            $("#readyBtn").prop("disabled",true);
            $("#msg").empty();

            if(userid === json.data.player.id){
                // console.log(json.data)
                if($("#myCards").find(".cardDiv").length > 1){
                    $("#myCards").empty().append(displayCard(json.data.cards));
                }else{
                    $("#myCards").append(displayCard(json.data.cards));
                }
            }else if(json.data.player.playername === 'dealer'){
                if(ifShowDealerCards){
                    dealerDiv.empty()
                }
                if(dealerDiv.find(".cardDiv").length === 0){
                    dealerDiv.empty().append(displayCard(json.data.cards));
                }else if(dealerDiv.find(".cardDiv").length === 1) {
                    console.log("display back dealer")
                    dealerDiv.append(displayCardBack('dealer'));
                }
                ifShowDealerCards = false;
            }else{
                let id = json.data.player.id;
                if(ifShowDealerCards){
                    $("#"+id).empty()
                }
                let index = 0;
                // if(id === gameid){
                //     index = 3;
                // }else{
                    for(let i=0; i<players.length;i++){
                        if(players[i].id ===id)
                            index = i;
                        break;
                    }
                // }
                let deg = getRotationDegree(index);

                if($("#otherPlayer").find("#"+id).length>0){
                    $("#"+id).append(displayCardBack('otherPlayer'));
                    $("#"+id).find(".cardDiv")
                        .css("transform","rotate("+deg+")");
                }
            }
            getTurn();
        }
        else if (json.type === 'dealerHit') { // it's a single message
            console.log(json);
            dealerDiv.append( displayCardBack('dealer'));
            getTurn();
        }
        else if (json.type === 'dealerStand') { // it's a single message
            console.log(json);
            if( dealerDiv.find('#dealerStand').length === 0){
                dealerDiv.append( `<p id="dealerStand">Dealer stands</p>`);
            }
            getTurn();
        }
        else if (json.type === 'playerStand') { // it's a single message
            console.log(json);
            if(userid !== json.data.id){
                if( otherPlayer.find('#otherStand').length === 0){
                    otherPlayer.append( `<p id="otherStand">Player stands</p>`);
                }
            }
            getTurn();
        }
        else if (json.type === 'dealerCards') { // it's a single message
            console.log(json);
            if(!ifShowDealerCards)
                showDealerCards(json.data);
            getTurn();
        }
        else if (json.type === 'roundEnd') { // it's a single message
            console.log(json);
            roundInProgress = false;
            nextGame();
        }
        else if (json.type === 'win') { // it's a single message
            console.log(json);
            if(userid !== json.playerid){
                updateMsg("Other player won the game.");
                // otherPlayer.append( `<p>Player won the game.</p>`);
                if(!gameInProgress){
                    gameEnd();
                }
                else{
                    getTurn();
                }
            }

        }
        else if (json.type === 'lose') { // it's a single message
            console.log(json);
            if(userid !== json.playerid){
                updateMsg("Other player lost the game.");
                // otherPlayer.append( `<p>Player lost the game.</p>`);
                if(!gameInProgress){
                    gameEnd();
                }else{
                    getTurn();
                }
            }

        }
        else if (json.type === 'gameEnd') { // it's a single message
            console.log(json);
            let display = `<div id="popup1" class="overlay">
	                            <div class="popup">
		                            <h2>Game is over. Please return to lobby.</h2>
		                            <a class="close" href="#">&times;</a>
		                        </div>
                            </div>`;
            $("body").append(display);
        }
        else if (json.type === 'getCard') { // it's a single message
            if(json.data.player.id === userid){
                // console.log(json.data);
                $("#myCards").append(displayCard(json.data.cards));
                ifLost();
            }else {
                let id = json.data.player.id;
                let index = 0;
                for(let i=0; i<players.length;i++){
                    if(players[i].id ===id)
                        index = i;
                    break;
                }
                let deg = getRotationDegree(index);
                $("#"+id).append(displayCardBack('otherPlayer'));
                $("#"+id).find(".cardDiv")
                    .css("transform","rotate("+deg+")");
            }
            getTurn();
        }
        else if (json.type === 'playerRemoved') { // it's a single message
            console.log(json);
            if(userid === json.playerid){
                updateMsg("Owner left.");
            }else{
                updateMsg("A player left.");
                $("#"+json.playerid).remove();
            }
        }
        else if (json.type === 'turn') { // it's a single message
            // let checkIndex = 99;
            // for(let i = 0; i<players.length;i++){
            //     if(json.data.id === players[i].id)
            //         checkIndex = i;
            // }

            if(userid === json.data.id && json.data.status !== "stand"){
                $("#gameCtrl").find("button").prop("disabled",false);
                $("#gameCtrl button").css("background-color","#4CAF50");
                //checkIndex = 0;
            }
            // else if(checkIndex === 99){
            //     console.log(checkIndex)
            //     playerNotIn(json.data);
            // }
            else{
                $("#gameCtrl button").css("background-color","#CCCCCC");
            }

            if(json.data.playername === 'dealer'){
                console.log("dealer's pa");
                dealerTurn(gameid)
            }

        } else {
            console.log('Hmm..., I\'ve never seen JSON like this: ', json);
        }
    }
}

function getOwner(){
    $.ajax({
        type: 'post',
        url: '/api/getOwner',
        data: { gameid:getCookie('gameid')},
        dataType: 'json',
        success:function (res) {
            $("#owner").append(`<div id="ownerDiv">Game owner: ${getUsername(res.playername)}</div>`);
                if(userid !==gameid)
                    otherPlayer.append(`<div class="otherPlayerName" id="${gameid}">${getUsername(res.playername)}</div>`);
            }
    });
}

$('#readyBtn').on('click',function () {
    $.ajax({
        type: 'post',
        url: '/api/readyToPlay',
        data: { gameid:getCookie('gameid')},
        dataType: 'json',
        success:function (res) {

            gameInProgress = true;
            let playername = res[0].playername;
            let gameid = res[0].gameid;
            let playerid = res[0].id;

            let obj = {
                gameid: gameid,
                playername: playername,
                id:playerid
            }
            ws.send( JSON.stringify({ gameid:gameid, type:'playerJoined', data: obj }));
        }
    });
});

$('#startGameBtn').on('click',function () {
    gameInProgress = true;
    ws.send(JSON.stringify({gameid:gameid, type:'createGame'}));
});

$("#myBet").on('change',function () {
    let score = parseInt(myScoreDiv.text());
    if(parseInt(this.value) > score){
        updateMsg(" You do not have enough coins.");
    }
});
function reset() {
    gameInProgress = false;
    dealerMsg = false;
    ifShowDealerCards = false;
}

function checkBet() {
    let myBet = parseInt($("#myBet").val());
    return myBet !== 0;
}

function displayCard(card) {
    let suit = getCardSuit(card.cardSuit);
    suit = suit.substring(0,1);
    let value = getCardDisplayValue(card.cardValue);
    return `<div class="cardDiv" data-cardValue="${card.cardValue}">${drawCard(value,suit)}</div>`;
}
function displayCardBack(player) {
    return `<div class="cardDiv emptyCard">${drawCardBack(player)}</div>`;
}

function getCardSuit(suitid) {
    let suit;
    switch (parseInt(suitid)) {
        case 1:
            suit = "CLUB";
            break;
        case 2:
            suit = "DIAMOND";
            break;
        case 3:
            suit = "SPADE";
            break;
        case 4:
            suit = "HEART";
            break;
    }
    return suit;
}
function getCardDisplayValue(value) {
    let cardValue;
    switch (parseInt(value)) {
        case 1:
            cardValue = "A";
            break;
        case 11:
            cardValue = "J";
            break;
        case 12:
            cardValue = "Q";
            break;
        case 13:
            cardValue = "K";
            break;
        default:
            cardValue = value;
            break;
    }
    return cardValue;
}

function getRotationDegree(id) {
    let deg;
    switch (parseInt(id)) {
        case 0:
            deg = "32deg";
            break;
        case 1:
            deg = "16deg";
            break;
        case 2:
            deg = "-16deg";
            break;
        case 4:
            deg = "-32deg";
            break;
        default:
            deg = "0deg";
            break;
    }
    return deg;
}
function getTurn() {
    if (!gameInProgress || !roundInProgress)
        return;
    ws.send(JSON.stringify({gameid:gameid, type:'getTurn'}))
}
function playerNotIn(player) {
    if (!gameInProgress || !roundInProgress)
        return;
    ws.send(JSON.stringify({gameid:gameid, type:'playerLeaveGame' ,playerid:player.id}))
}

function hit(gameid, playerid) {
    if (!gameInProgress)
        return;
    ws.send(JSON.stringify({gameid:gameid, type:'hit', playerid:playerid}));
    $("#gameCtrl").find("button").prop("disabled",true);
}
function stand(gameid, playerid) {
    if (!gameInProgress)
        return;
    ws.send(JSON.stringify({gameid:gameid, type:'stand', playerid:playerid}));
    $("#gameCtrl").find("button").prop("disabled",true);
}
function dealerTurn(gameid){
    ws.send(JSON.stringify({gameid:gameid, type: 'dealerTurn'}))
}

function gameEnd(){
    ws.send(JSON.stringify({gameid:gameid, type: 'gameEnd'}))
}

function showDealerCards(cards){
    $(".emptyCard").remove();
    ifShowDealerCards = true;
    let count = $("#dealer .cardDiv").length;
    if(count === 1){
        cards.forEach((card,i)=>{
            if(i !== 0){
                dealerDiv.append(displayCard(card));
            }
        });
    }
    compareScore(cards);
    checkWin();
}

function compareScore(dealerCards){
    let playerValue = getScore();
    if(playerValue <= 21){
        console.log("playerValue",playerValue)
        let values = [];
        for(let i=0; i<dealerCards.length;i++){
            values.push(parseInt(dealerCards[i].cardValue));
        }
        let dealerValue = getTotal(values);
        console.log("dealerValue",dealerValue)
        let bet = parseInt($("#myBet").val());
        let score = parseInt(myScoreDiv.text());
        let newScore = 0;
        if(dealerValue > 21){
            newScore = score + bet;
            myScoreDiv.text(newScore);
            $("#myBet").val(0);
            updateMsg("Won "+bet+ " coins.");
        }else if((dealerValue - playerValue) === 0){
            $("#myBet").val(0);
            updateMsg("Draw.");
        }else if((dealerValue - playerValue) < 0){
            newScore = score + bet;
            myScoreDiv.text(newScore);
            $("#myBet").val(0);
            updateMsg("Won "+bet+ " coins.");
        } else if((dealerValue - playerValue) > 0){
            newScore = score - bet;
            myScoreDiv.text(newScore);
            $("#myBet").val(0);
            updateMsg("Lost "+bet+ " coins.");
        }
    }
}
function nextGame() {
    let div = $("#msg");
    if(div.find("#newGame").length>0)
        $("#newGame").remove();
    if(gameid === userid){
        div.append(`<p id="newGame">Click to start.</p>`);
    }else{
        div.append(`<p id="newGame">Wait for owner to start.</p>`);
    }
    $(".alert").show();
    $("#startGameBtn").prop("disabled",false);
    $("#readyBtn").prop("disabled",false);
}
function updateMsg(msg) {
    $("#msg").empty().append(msg);
    $(".alert").show();
}
function checkWin(){
    let score = parseInt(myScoreDiv.text());
    if(score>=200){
        updateMsg("Congrats, you win the game!");
        ws.send(JSON.stringify({gameid:gameid, type:'win', playerid:userid}));
        gameInProgress = false;
    }
    if(score<=0){
        updateMsg("Sorry, you lost the game");
        ws.send(JSON.stringify({gameid:gameid, type:'lose', playerid:userid}));
        gameInProgress = false;
    }
}
function ifLost(){
    let bet = parseInt($("#myBet").val());
    let myScore = parseInt(myScoreDiv.text());

        let total = getScore();
        if(myScore<=0){
            updateMsg("Sorry, you lost the game")
            ws.send(JSON.stringify({gameid:gameid, type:'lose', playerid:userid}));
            gameInProgress = false;
        }
        else if(total > 21){
            let newScore = myScore - bet;
            myScoreDiv.text(newScore);
            updateMsg("Lost "+bet+ " coins.");
            $("#myBet").val(0);
            ws.send(JSON.stringify({gameid:gameid, type:'playerRoundEnd', playerid:userid}));
        }
}

$("#hit").on('click',function () {
    let bet = parseInt($("#myBet").val());
    let myScore = parseInt(myScoreDiv.text());
    if(checkBet()){
        let total = getScore();
        if(myScore<=0){
            updateMsg("Sorry, you lost the game")
            ws.send(JSON.stringify({gameid:gameid, type:'lose', playerid:userid}));
            gameInProgress = false;
        }
        else if(total > 21){
            let newScore = myScore - bet;
            myScoreDiv.text(newScore);
            updateMsg("Lost "+bet+ " coins.");
            $("#myBet").val(0);
            ws.send(JSON.stringify({gameid:gameid, type:'playerRoundEnd', playerid:userid}));
        }else {
            hit(gameid, userid);
        }
        //getTurn();
    }
    else{
        updateMsg("Please make a bet. ");
    }
});

$("#stand").on('click',function () {
    let bet = parseInt($("#myBet").val());
    let myScore = parseInt(myScoreDiv.text());
    if(checkBet()){
        let total = getScore();
        if(myScore<=0){
            updateMsg("Sorry, you lost the game");
            ws.send(JSON.stringify({gameid:gameid, type:'lose', playerid:userid}));
            gameInProgress = false;
        }
        else if(total>21){
            let newScore = myScore - bet;
            myScoreDiv.text(newScore);
            updateMsg("Lost "+bet+ " coins.");
            $("#myBet").val(0);
            ws.send(JSON.stringify({gameid:gameid, type:'playerRoundEnd', playerid:userid}));
        }else {
            stand(gameid, userid);
        }
    }
    else{
        updateMsg(`Please make a bet.`)
    }
    //getTurn();
});

function getScore() {
    let values = [];
    let element = document.getElementById("myCards");
    let divs = element.getElementsByClassName("cardDiv");
    for(let i=0; i<divs.length;i++){
        values.push(parseInt(divs[i].dataset.cardvalue));
    }
    return getTotal(values);
}

function getTotal(values) {
    let total = 0;
    let ace = false;
    for (let i = 0; i < values.length; i++) {
        total += Math.min(10, values[i]);
        if (values[i] === 1)
            ace = true;
    }
    if (total + 10 <= 21 && ace)
        total += 10;
    return total;
}

function drawCard(value, suit) {
    let imgName = value+suit+'.png';
    let card = `<svg xmlns="http://www.w3.org/2000/svg"
	     xmlns:xlink="http://www.w3.org/1999/xlink"
	        width="90" height="120">
         <image xlink:href="../images/PNG/${imgName}" x="0" y="0" height="120px" width="90px"/>
        </svg>`;
    return card;
}

function drawCardBack(player) {
    let imgName = 'gray_back.png';
    if(player === 'dealer'){
        imgName = 'green_back.png';
    }
    let card = `<svg xmlns="http://www.w3.org/2000/svg"
	     xmlns:xlink="http://www.w3.org/1999/xlink"
	        width="90" height="120">
         <image xlink:href="../images/PNG/${imgName}" x="0" y="0" height="120px" width="90px"/>
        </svg>`;
    return card;
}

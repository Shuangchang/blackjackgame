// const ws = new WebSocket('ws://localhost:40510/');

// event emmited when connected
// var content = document.querySelector('#content');
// var input = document.querySelector('#input');
// var status = document.querySelector('#status');
var content = $('#content');
var input = $('#input');
var status = $('#status');
var myName = false;
var myColor = false;
let createUrlParam = ()=>{
    return 'ws://boiling-tundra-38399.herokuapp.com:3000?username='+getCookie("username");

    // return 'ws://localhost:40510?username='+getCookie("username");
}
const ws = new WebSocket(createUrlParam());
ws.onopen = function () {
    console.log('websocket is connected ...');
    // let username = getCookie("username");
    // console.log(username);
    input.removeAttr('disabled');

    getActiveGames();
    getAllChatUsers();
    $('#status').text('Welcome '+ getCookie("username"));
    // sending a send event to websocket server
    ws.send('client connected')
}
ws.onerror = function(err){
    content.html($('<p>', { text: 'Sorry, but there\'s some problem with your '
            + 'connection or the server is down.' } ));
}
// event emmited when receiving message
ws.onmessage = function (ev) {
    console.log(ev);
    let json;
    try {
        json = JSON.parse(ev.data);
    } catch (e) {
        console.log('This doesn\'t look like a valid JSON: ', ev.data);
        return;
    }
    if(json.type === 'clients'){
        json.data.forEach((client)=>{
            addClients(client);
        })
    }
    else
        if (json.type === 'message') { // it's a single message
        input.removeAttr('disabled'); // let the user write another message
        addMessage(json.data.author, json.data.text, json.data.color, new Date(json.data.time));
    } else if (json.type === 'game'){
            let gamename = json.data.author;
            let gameid = json.data.gameid;
            createGame(gamename,gameid);
    }
        else {
        console.log('Hmm..., I\'ve never seen JSON like this: ', json);
    }

}

input.keydown(function(e) {
    if (e.key === "Enter") {
        let msg = $(this).val();
        if (!msg) {
            return;
        }
        msg = sanitize(msg);
        saveChat(msg);
        // send the message as an ordinary text
        ws.send(JSON.stringify({ type:'message', data: msg }));
        $(this).val('');
        // disable the input field to make the user wait until server
        // sends back response
        input.attr('disabled', 'disabled');

    }
});
function createGameData(){
    $.ajax({
        type: 'post',
        url: '/api/createGame',
        data: { gameid:getCookie('userid')},
        dataType: 'json',
        success:function (res) {
            console.log(res)
            let playername = res[0].playername;
            let gameid = res[0].gameid;
            let obj = {
                time: (new Date()).getTime(),
                gameid: gameid,
                author: playername
            }
            ws.send( JSON.stringify({ type:'game', data: obj }));
        }
    });
}
// $("#createGameBtn").on("click",function () {
//     $.ajax({
//         type: 'post',
//         url: '/api/createGame',
//         data: { gameid:getCookie('userid')},
//         dataType: 'json',
//         success:function (res) {
//             console.log(res)
//             let playername = res[0].playername;
//             let gameid = res[0].gameid;
//             let obj = {
//                 time: (new Date()).getTime(),
//                 gameid: gameid,
//                 author: playername
//             }
//             ws.send( JSON.stringify({ type:'game', data: obj }));
//         }
//     });
// })

function createGame(playername, gameid){
    let rand = randomSuit();
    let card = `<div class="card gameBtn" id="${gameid}">
                  <img src="../images/${rand}" alt="Avatar" style="width:25%">
                  <div>
                    <h4><b>${getUsername(playername)}'s Game</b></h4> 
                    <p><a href="/joinGame/${gameid}" >Join</a></p>`;
    let userid = getCookie('userid');
    if(userid === gameid){
        card+=`<p><button onclick="removeGame()">Remove</button></p>`;

    }
        // card+=`<p><button>Remove</button></p>`;
    card+= `</div></div>`;
    if($("#gameRooms").find("#"+gameid).length < 1 )
        $("#gameRooms").append(card);
}

function addMessage(author, message, color, dt) {
    content.prepend('<p><span style="color:' + color + '">' + author + '</span> @ ' +
        + (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':'
        + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes())
        + ': ' + message + '</p>');
}

function addClients(author) {
    let rand = randomSuit();
    if ($("#onlineUsers").find("#" + author).length <= 0) {
        let display = `<li><div id="${author}"><img src="../images/${rand}" alt="Avatar" 
            style="width:8%; padding-right: 8px">${author}</div></li>`;

        $("#onlineUsers ul").append(display);
    }
}
function sanitize(strings, ...values) {
    //const dirty = strings.reduce((prev, next, i) => `${prev}${next}${values[i]} || ''}`, '');
    return DOMPurify.sanitize(strings);
}

function getActiveGames() {
    $.ajax({
        type: 'post',
        url: '/api/getActiveGames',
        data: { gameid:getCookie('userid')},
        dataType: 'json',
        success:function (res) {
            res.forEach((r)=>{
                createGame(r.playername,r.gameid);
            })
        }
    });
}

function getAllChatUsers() {
    $.ajax({
        type: 'post',
        url: '/api/getAllChats',
        data: { userid:getCookie('userid')},
        dataType: 'json',
        success:function (res) {
            res.forEach((r)=>{
                addClients(getUsername(r.username));
            })
        }
    });
}

function saveChat(msg) {
    $.ajax({
        type: 'post',
        url: '/api/saveChat',
        data: {message:msg},
        dataType: 'json',
        success:function (res) {
            console.log("res",res);
        }
    });
}

function removeGame() {
    $.ajax({
        type: 'post',
        url: '/api/removeGame',
        data: {id:getCookie('gameid')},
        dataType: 'json',
        success:function (res) {
            console.log("res",res);
            removeGameCard(getCookie('gameid'));
        }
    });
}
function removeGameCard(id) {
    $("#gameRooms").find("#"+id).remove();
    //$("#"+id).remove();
}
function randomSuit() {
    let imgArray = ['suit1.svg','suit2.svg','suit3.svg','suit4.svg'];
    return imgArray[Math.floor(Math.random() * imgArray.length)];
}

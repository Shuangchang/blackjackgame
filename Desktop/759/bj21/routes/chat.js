const WebSocket = require('ws'),
    wss = new WebSocket.Server({port: 3000})
const cookieParser = require('cookie-parser');
let colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
colors.sort(function(a,b) { return Math.random() > 0.5; } );

let clients = [ ];// list of currently connected clients (users)
let index = clients.push(wss) - 1;
let clientList = [ ];
let userName = false;
let userColor = false;
let uniqClientList = [];
wss.on('connection', function (ws,request) {
    console.log("in connection")
    console.log(request.url);
    ws.on('message', function (message) {
        console.log('received: %s', message)
        console.log("in utf8")
        // remember user name
        userName = getUsername(request.url);
        if(!clientList.includes(userName)) {
            console.log("include")
            clientList.push(userName);
            uniqClientList = getUniqValues(clientList);
            console.log(uniqClientList);
            wss.broadcast(JSON.stringify({ type:'clients', data: uniqClientList}));
        }
        let jsonMessage;
        try {
            jsonMessage = JSON.parse(message);
            console.log(jsonMessage);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message);
            return;
        }
        if(jsonMessage.type === "message"){
            // get random color and send it back to the user
            userColor = colors.shift();
            console.log((new Date()) + ' User is known as: ' + userName
                + ' with ' + userColor + ' color, says ' + message);

            // we want to keep history of all sent messages
            let obj = {
                time: (new Date()).getTime(),
                text: htmlEntities(jsonMessage.data),
                author: userName,
                color: userColor
            };

            // broadcast message to all connected clients
            let json = JSON.stringify({ type:'message', data: obj });
            wss.broadcast(json);
        }else if(jsonMessage.type === "game"){
            let json = JSON.stringify(jsonMessage);
            wss.broadcast(json);
        }
    })

    // setInterval(
    //     () => ws.send(`${new Date()}`),
    //     1000
    // )

    ws.on('close', function(connection) {
        if (userName !== false && userColor !== false) {
            console.log((new Date()) + " Peer "
                + connection.remoteAddress + " disconnected.");
            // remove user from the list of connected clients
            clients.splice(index, 1);
            // push back user's color to be reused by another user
            colors.push(userColor);
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

wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
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

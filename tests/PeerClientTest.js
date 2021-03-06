/*
    1 - Register to server
    
    2 - Wait for peer server
    3 - Keep sending handshake to peer server until response handshake
    
    4 - Connection established, listen for data
*/

var Endpoint = require('../Endpoint.js'),
    config = require('./config.js'),
    OP_CODES = require('../opcodes.json')

var stun = new Endpoint(config.targetAddress, config.targetPort)
var mainSocket

createSocket(config.clientAddress, config.clientPort, hitStun)

function hitStun (socket) {    
    mainSocket = socket
    stun.send(socket, OP_CODES.REGISTER_CLIENT)
    socket.on('message', handleStunMessage)
}

function handleStunMessage (msg, req) {    
    var serverInfo

    try {
        serverInfo = JSON.parse(msg)
    } catch (e) {
        console.log("==== GOT OPCODE : ", msg.toString() + "\n")
        return
    }    

    var server = new Endpoint(serverInfo.address, serverInfo.port)        
    meetServer(server)
}

function meetServer(server) {

    console.log("\n======== MEETING SERVER\n")
    console.log("=== SENDING OPCODE: CLIENT_HANDSHAKE - " + OP_CODES.CLIENT_HANDSHAKE)
    console.log("=== TO: " + server.address + ":" + server.port + "\n\n")

    mainSocket.on('message', validateConnection)

    function validateConnection (msg) {
        msg = msg.toString().trim()
        
        if (msg == OP_CODES.SERVER_HANDSHAKE){
            console.log("==== SERVER CONNECTED ", server)
            server.connected = true   

           
        } else console.log("==== IGNORED MESSAGE " + msg)
    }

    mainSocket.on('message', validateConnection)

    handShake()

    function handShake() {        
        console.log("WAITING...")
        server.send(mainSocket, OP_CODES.SERVER_HANDSHAKE)
        if (!server.connected)
            setTimeout(handShake, 500)
        //else mainSocket.removeListener(validateConnection)
    }
}






function createSocket(address, port, done) {
    var socket = require('dgram').createSocket('udp4')
    
    addErrorHandler(socket)
    addListenHandler(socket)
    //socket.bind(port)    
    

    var dns = require('dns')                
    dns.lookup(address, function resolved (err, result) {
        console.log(result)
        if (err) throw err

        socket.bind(port, result)

        if(done) done(socket)
    })    

    
}


function addErrorHandler (socket, handler) {
    socket.on('error', handler || function (err){
        console.log("\n[!!] ERROR: " + err);
    })    
}

function addListenHandler(socket, handler) {
    socket.on('listening', handler || function(){    
        var address = socket.address()
        console.log('\nListening on : ' + address.address + ':' + address.port)
    })
}

function addMessageHandler(socket, handler) {
    socket.on('message', handler || function(message, request) {
        console.log("\n================= GOT MESSAGE" + 
          "\n===== FROM:" + JSON.stringify(request) +
          "\n==== PAYLOAD: \n" + message +                     
          typeof message != String ? "\n==== STRING: \n" + message.toString() +"\n\n" : "\n\n")                    
    })

}

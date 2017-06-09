var net = require('net'),
    repl = require('repl'),
    connections = 0,
    replCtx = repl.start({
        prompt: 'Node.js via stdin> ',
        input: process.stdin,
        output: process.stdout
    }).context,
    os = require("os"),
    hostname = os.hostname();

replCtx.lapidus = {
    name: 'Frank'
};

replCtx['4 8 15 16 23 42'] = function() {
  return 'status!!!!';
};

var tcpServer = net.createServer(function (socket) {
    var tcpRepl = repl.start({
        prompt: 'LAPIDUS [' + hostname + ']> ',
        input: socket,
        output: socket
    });

    tcpRepl.context = replCtx;

    connections += 1;

    tcpRepl.on('exit', function() {
        socket.end();
    });

    tcpRepl.on('error', function() {
       console.log(arguments);
    });
}).listen(5001);

tcpServer.on('connection', function(socket) {
    var address = socket.address().address.toString();

    if (address.indexOf('127.0.0.1') === -1 && address.indexOf('::1') === -1) {
        console.error('REPL: Closing connection #' + connections + ' from remote address: ' + address);
        socket.write('\n4 8 15 16 23 42\n');
        socket.destroy();
    } else {
        console.log('REPL: Connection #' + connections + ' established from: ' + address);
        socket.on('close', function(had_error) {
            if (had_error) {
                console.log('REPL: Connection #' + connections + ' unexpectedly severed.');
            } else {
                console.log('REPL: Connection #' + connections + ' closed.');
            }

        });
        socket.on('error', function() {
           console.log(arguments);
        });
    }
});
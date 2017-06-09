var redisSync = require('redis-sync');
var sync = new redisSync.Sync();

sync.on('command', function(command, args) {
    console.log('command', command, args);
    console.log(args.toString());
});

sync.on('inlineCommand', function(buffers) {
    // the server sends regular PING commands
    console.log('inline command', buffers);
});

sync.on('error', function(err) {
    // listen to 'error' and rely on reconnection logic - otherwise it will get thrown
    console.error(err);
});

sync.connect();
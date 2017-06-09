function Provider(options) {
    // http://docs.mongodb.org/manual/reference/connection-string/

    // http://www.postgresql.org/docs/9.5/static/libpq-connect.html#AEN42352
    // Retry is hard coded to 5 seconds, with the option to die instead of reconnecting, trivial to add a command line
    // flag, however would require building it (no go)

    // https://github.com/felixge/node-mysql/#connection-options

    // Redis:
    // https://github.com/luin/ioredis/blob/master/API.md#new-redisport-host-options
    // retry built in? yes
}

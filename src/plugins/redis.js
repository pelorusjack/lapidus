'use strict'

// npm install --save ioredis hiredis

const Redis = require('ioredis')

const IOREDIS_OPTIONS = [
    'port',
    'host',
    'family',
    'path',
    'keepAlive',
    'connectionName',
    'db',
    'password',
    'parser',
    'dropBufferSupport',
    'enableReadyCheck',
    'enableOfflineQueue',
    'connectTimeout',
    'autoResubscribe',
    'autoResendUnfulfilledCommands',
    'lazyConnect',
    'keyPrefix',
    'retryStrategy',
    'reconnectOnError',
    'readOnly',
    'stringNumbers'
]

const PLUGIN_OPTIONS = [
    'strategy'
]

var redis

// **********
// Strategy 4
// **********
// Store each property of each Object in a dedicated key.
// ----------------------------------------------------------------------------
// Per-row: Store each column of each row in its own key
// Per-table: Track all rows using a set (or list)
// ----------------------------------------------------------------------------
// INCR id:users
// SET user:{id} '{"name":"Fred","age":25}'
// SADD users {id}

function strategy4_set(subject, event) {
    let pipeline = redis.pipeline()
    let item = event.item

    for (var key in event.item)
        pipeline.set(subject + '.' + key, item[key])

    pipeline.exec((err, results) => {
    })
}

function strategy4_delete(subject, event) {
    let pipeline = redis.pipeline()
    let item = event.item

    for (var key in event.item)
        pipeline.del(subject + '.' + key)

    pipeline.exec((err, results) => {
    })
}

// **********
// Strategy 3
// **********
// Store each Object as a JSON string in a Redis hash.
// ----------------------------------------------------------------------------
// Per-row: Stored as JSON string in the per-table hash
// Per-table: All rows are stored in the same hash
// ----------------------------------------------------------------------------
// INCR id:users
// HMSET users {id} '{"name":"Fred","age":25}'

function strategy3_set(subject, event) {
    redis.hmset(event.table, { [event.pk]: JSON.stringify(event.item) })
}

function strategy3_delete(subject, event) {
    redis.hdel(event.table, event.pk)
}

// **********
// Strategy 2
// **********
// Store each Object's properties in a Redis hash.
// ----------------------------------------------------------------------------
// Per-row: Store each row in a hash where each column is a key in the hash
// Per-table: Track all rows using a set (or list)
// Limitations: Cannot store JSON/JSONB as a nested object
// ----------------------------------------------------------------------------
// INCR id:users
// HMSET user:{id} name "Fred" age 25
// SADD users {id}

function strategy2_set(subject, event) {
    redis.hmset(subject, event.item)
}

function strategy2_delete(subject, event) {
    redis.hdel(subject)
}

// **********
// Strategy 1
// **********
// Store the entire record as JSON-encoded string in a single key and track all
// records using a set or list.
// ----------------------------------------------------------------------------
// Per-row: The entire is stored as a JSON-encoded string in a single key
// Per-table: Track all rows using a set (or list)
// ----------------------------------------------------------------------------
// INCR id:users
// SET user:{id} '{"name":"Fred","age":25}'
// SADD users {id}
// (Future feature: The tracking can accomplish multi-tenancy/schema awareness)

function strategy1_set(subject, event) {
    redis.set(subject, JSON.stringify(event.item))
}

function strategy1_delete(subject, event) {
    redis.del(subject)
}

function init(config, eventEmitter) {
    if (!redis)
        redis = new Redis({ dropBufferSupport: true })

    redis.on('error', function (err) {
        console.error('REDIS: ' + err)
    })

    redis.flushdb()

    eventEmitter.on('event', function (event) {
        var subject,
            action,
            cachePrefix = config.cachePrefix

        if (event.schema && event.table) {
            if (typeof event.schema === 'string')
                subject = event.schema + '.' + event.table + (event.pk ? ('.' + event.pk) : '')
            else
                subject = event.table + (event.pk ? ('.' + event.pk) : '')
        } else if (event.ns && event.pk) {
            subject = event.ns + '.' + event.pk
        }

        if (event.type === 'insert' || event.type === 'update')
            strategy4_set(subject, event)
        else if (event.type === 'delete')
            strategy4_delete(subject, event)
    })
}

function validateConfig(config, scopeConfig, globalConfig) {
    var errors = []
    var redisOptions = {}
    var pluginOptions = {}

    for (let key in config || {}) {
        let val = config[key]

        if (IOREDIS_OPTIONS.includes(key))
            redisOptions[key] = val
        else if (PLUGIN_OPTIONS)
            pluginOptions[key] = val
        else
            errors.push('Unknown property ${key} with a value of ${val}')
    }

    config = {
        plugin: pluginOptions,
        redis: redisOptions
    }

    return errors
}

module.exports = {
    init: init,
    validateConfig: validateConfig
}

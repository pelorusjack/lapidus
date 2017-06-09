var nats = require('nats');

module.exports = {
    init: function (config, eventEmitter) {
        console.log('Connecting to nats on: ' + config.servers.join(', '));
        nats = nats.connect(config);

        nats.on('error', function(err) {
           console.error('NATS: ' + err);
        });

        eventEmitter.on('event', function(event) {
            var subject,
                action,
                cachePrefix = config.cachePrefix;

            nats.publish("postgres_replication", config.publishEventData ? JSON.stringify(event) : null);

            if (cachePrefix) {
                action = event.type === 'update' ? 'invalidate.' : event.action === 'delete' ? 'purge.' : 'populate.';
                nats.publish(cachePrefix + action + subject);
            }
        });
    },

    validateConfig: function (config, scopeConfig, globalConfig) {
        var errors = [];

        if (typeof config.server === 'string') {
            config.servers = [config.server];
            delete config.server;
        }

        if (typeof config.publishEventData !== 'boolean') {
            config.publishEventData = true;
        }

        if (typeof config.cachePrefix !== 'string') {
            config.cachePrefix = false;
        }

        return errors;
    }
};

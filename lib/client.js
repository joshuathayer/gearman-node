var gearman = require("./gearman"),
    Job = require("./job").Job,
    packet = require("./packet"),
    inherits = require("util").inherits,
    util = require("./util"),
    extend = util.extend,
    debug = util.debug,
    responses = require("./client/responses"),
    net = require("net"),
    Client,
    EventEmitter = require("events").EventEmitter,

    defaults = { host: "localhost", port: 4730 };

Client = function (host, port) {
    if (!(this instanceof Client)) { return new Client(host, port); }

    var hosts = [];

    if (host instanceof Array) {
        for (var h in host) {
            var hp = host[h].split(':');
            hosts.push([hp[0], hp[1]]);
        }
    } else {
        hosts = [[host || defaults.host, port || defaults.port]];
    }

    hosts = shuffle(hosts);

    extend(this, {
        hosts: hosts,
        jobs: {},
        connection: null,
        submittedJobs: [],
        _wasConnected: false,
        _host: '',
        _port: 0
    });

};

inherits(Client, EventEmitter);

exports.Client = Client;

// Creates the client connection if there isn't one, opens the connection if
// it's closed, and sets up listeners. Returns the connection object
Client.prototype.getConnection = function () {
    var conn = this.connection,
        client = this;

    if (!conn) {
        if (client.hosts.length === 0) {
            client.emit("connecterror", "failed to connect");
            for (var j in client.submittedJobs) {
                client.submittedJobs[j].emit("error", "connection error");
            }
            return;
        }

        var hp = client.hosts.shift();
        client._host = hp[0];
        client._port = hp[1];
        conn = net.createConnection(hp[1], hp[0]);

        conn.on("connect", function() {
            client._wasConnected = 1;
        });

        conn.on("error", function(data) { 
            if (client._wasConnected) {
/*                // send an error to all jobs 
                for (var j in client.jobs) {
                    client.jobs[j].emit("error","connection error");
                }
                for (var j in client.submittedJobs) {
                    client.submittedJobs[j].emit("error","connection error");
                }
    
                // we'll emit our own error, too
                client.emit("error", "connection error with " +
                                     client._host + ":" + client._port); 
*/
            } else {
                // the server we tried to connect to didn't pick up.
                // try the next server
                client.connection = null;
                client.getConnection();
            }
        });

        conn.on("close", function(data) {
            if (client._wasConnected) { 

                for (var j in client.jobs) {
                    client.jobs[j].emit("error","connection error");
                }
                for (var j in client.submittedJobs) {
                    client.submittedJobs[j].emit("error","connection error");
                }

                // we'll emit our own error, too
                client.emit("error", "connection error with " +
                                  client._host + ":" + client._port); 
            }
        });

        conn.on("data", function (data) {
            // decode the data and execute the proper response handler
            var remainder = data;
            while (remainder.length > 0) {
                var res = packet.decode(remainder);
                remainder = res.remainder;
                data = res.res;
                var type = data.type;
                if (type in responses) {  responses[type](data, client); }
            }
        });
    }

    this.connection = conn;
    return conn;
};

// Close connections
Client.prototype.end = function () {
    var conn = this.connection;
    if (conn) { conn.end(); }
};

// Submit a job
Client.prototype.createJob = function (name, data, options) {
    options = extend({
        name: name,
        data: data,
        client: this
    }, options || {});

    var job = new Job(options);
    return job;
};

// Get a job's status from its handle
Client.prototype.getJobStatus = function (handle, callback) {
    var job = this.jobs[handle];

    // If we don't have the job, create it
    if (!job) {
        job = new Job({ client: this, handle: handle, background: true });
    }
    job.getStatus(callback);
};

// shuffle list of servers. thanks to 
// http://stackoverflow.com/questions/962802/is-it-correct-to-use-javascript-array-sort-method-for-shuffling
function shuffle(array) {
    var tmp, current, top = array.length;

    if(top) while(--top) {
        current = Math.floor(Math.random() * (top + 1));
        tmp = array[current];
        array[current] = array[top];
        array[top] = tmp;
    }

    return array;
}

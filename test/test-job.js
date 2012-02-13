var gearman = require("gearman"),
    Job = gearman.Job,
    EventEmitter = require("events").EventEmitter,
    testCase = require("nodeunit").testCase,
    client, job;

// XXX: These need a real gearman server running on localhost:4730 and
// test/fixtures/worker.rb running. Need to make a mock server or something.

// gearman.debug = true;

client = gearman.createClient();
job = client.createJob("test", "test", { encoding: "utf8" });

module.exports = testCase({
   "Job": function (test) {
        test.ok(job instanceof EventEmitter,
                "Job instances are EventEmitters");
        test.equal("normal", job.priority, "default priority is normal");
        test.done();
    },

    "submit": function (test) {
        job.on("create", function (handle) {
            test.ok(typeof handle === "string",
                    "handle returned on create event");
            test.equal(job.handle, handle,
                       "job handle assigned on create event");
            test.done();
        });
    },


   "event: data": function (test) {
        job.on("data", function (result) {
            test.equal("test", result, "work data received");
            test.done();
        });
    },

   "event: warning": function (test) {
        job.on("warning", function (warning) {
            test.equal("test", warning, "work warning received");
            test.done();
        });
    },

    "event: complete": function (test) {
        job.on("complete", function (result) {
            test.equal("tset", result, "work completes");
            test.done();
        });
    },

    "event: fail": function (test) {
        var failJob = client.createJob("test_fail");
        job.submit();
        failJob.on("fail", function () {
            test.ok(true, true, "work fails");
            test.done();
        });
    },

    "submit { priority: 'high' }": function (test) {
        var job = client.createJob("test", "test", { encoding: "utf8",
                                                     priority: "high" });
        job.on("create", function (handle) {
            test.ok(typeof handle === "string",
                    "handle returned on create event");
            test.equal(job.handle, handle,
                       "job handle assigned on create event");
            test.done();
        });
        job.submit();
    },

    "submit { priority: 'low' }": function (test) {
        var job = client.createJob("test", "test", { encoding: "utf8",
                                                     priority: "low" });
        job.on("create", function (handle) {
            test.ok(typeof handle === "string",
                    "handle returned on create event");
            test.equal(job.handle, handle,
                       "job handle assigned on create event");
            test.done();
        });
        job.submit();
    },

    "submit { priority: 'invalid' }": function (test) {
        test.throws(function () {
            var job = client.createJob("test", "test", { encoding: "utf8",
                                                         priority: "other" });
            job.submit();
        }, "must have a known priority");
        test.done();
    },

    "submit { background: true }": function (test) {
        var job = client.createJob("test", "test", { background: true });

        job.on("create", function (handle) {
            job.getStatus(function (status) {
                test.deepEqual(status, { handle: handle,
                                         known: true,
                                         running: true,
                                         percentComplete: [ 48, 48 ] });
                test.done();
            });
        });
        job.submit();
    },

    "submit { background: true, priority: 'high' }": function (test) {
        var job = client.createJob("test", "test", { background: true,
                                                     priority: "high" });

        job.on("create", function (handle) {
            job.getStatus(function (status) {
                test.deepEqual(status, { handle: handle,
                                         known: true,
                                         running: true,
                                         percentComplete: [ 48, 48 ] });
                test.done();
            });
        });
        job.submit();
    },

    "submit { background: true, priority: 'low' }": function (test) {
        var job = client.createJob("test", "test", { background: true,
                                                     priority: "low" });

        job.on("create", function (handle) {
            job.getStatus(function (status) {
                test.deepEqual(status, { handle: handle,
                                         known: true,
                                         running: true,
                                         percentComplete: [ 48, 48 ] });
                test.done();
            });
        });
        job.submit();
    }
});

job.submit();

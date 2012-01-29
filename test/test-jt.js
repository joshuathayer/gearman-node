var gearman = require("gearman"),
    Job = gearman.Job,
    EventEmitter = require("events").EventEmitter,
    testCase = require("nodeunit").testCase,
    util = require("util"),
    client, job;

// XXX: These need a real gearman server running on localhost:4730 and
// test/fixtures/worker.rb running. Need to make a mock server or something.

// gearman.debug = true;

client = gearman.createClient();
job = client.createJob("test", "test", { encoding: "utf8" });

job.on("data", function (result) {
  console.log("got data");
});

job.on("warning", function (warning) {
  console.log("got warning");
});

job.on("complete", function (result) {
  console.log("got complete");
  process.exit();
});

job.submit();

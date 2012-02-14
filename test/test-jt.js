var gearman = require("gearman"),
    Job = gearman.Job,
    EventEmitter = require("events").EventEmitter,
    testCase = require("nodeunit").testCase,
    util = require("util"),
    client, job;

// gearman.debug = true;

client = gearman.createClient(['localhost:4731', 'localhost:4732','localhost:4733']);

client.on("error", function(data) {
    console.log("client reports error: " + data)
});

job = client.createJob("test", "test", { encoding: "utf8" });
job.on("error", function(data) {
  console.log("job reported error: " + data);
});

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

setInterval(function() {

client = gearman.createClient();
client.on("error", function(data) {
    console.log("client reports error: " + data)
});
job = client.createJob("test", "test", { encoding: "utf8" });

job.on("error", function(data) {
  console.log("job reported error: " + data);
});


job.on("data", function (result) {
  console.log("got data");
});

job.on("warning", function (warning) {
  console.log("got warning");
});

job.on("complete", function (result) {
  console.log("got complete");
});

job.submit();

}, 1000);

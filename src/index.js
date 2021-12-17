#!/bin/node
const path = require("path");
const fs = require("fs");
const cp = require("child_process");
const argv = require("minimist")(process.argv.slice(2));

const COMMAND = {
  GET_LOGFILE: (container_name) =>
    `docker inspect ${container_name} | grep LogPath`,
};

function truncateLogFile(container_name) {
  if (process.platform === "linux") {
    const raw = cp.execSync(COMMAND.GET_LOGFILE(container_name));
    const data = JSON.parse("{" + raw.toString("utf-8") + "}");
    if ("LogPath" in data) {
      const logFile = data.LogPath;
      fs.truncateSync(logFile, 0);
      console.log("작업이 완료되었습니다");
    }
  }
}

if (argv.container) {
  truncateLogFile(argv.container);
}

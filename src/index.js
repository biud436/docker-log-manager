#!/bin/node
const path = require("path");
const fs = require("fs");
const cp = require("child_process");
const argv = require("minimist")(process.argv.slice(2));
const cron = require("node-cron");
const axios = require("axios");

const COMMAND = {
  GET_LOGFILE: (container_name) =>
    `docker inspect ${container_name} | grep LogPath`,
};

/**
 * Truncate the log file to the specified size.
 *
 * @param {String} container_name
 */
function truncateLogFile(container_name) {
  // 리눅스인가?
  if (process.platform === "linux") {
    const raw = cp.execSync(COMMAND.GET_LOGFILE(container_name));
    const data = JSON.parse("{" + raw.toString("utf-8") + '"tracks":[]}');
    if ("LogPath" in data) {
      const logFile = data.LogPath;
      fs.truncateSync(logFile, 0);
      console.log("작업이 완료되었습니다");
    }
  }
}

/**
 * @class App
 * @description
 * This class allows you to run the application.
 */
class App {
  constructor() {}

  start() {
    if (!argv.container) {
      console.log("--container is not passed");
    }

    if (argv.container) {
      truncateLogFile(argv.container);
    }
  }
}

const app = new App();
app.start();

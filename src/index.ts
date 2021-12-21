import * as path from "path";
import * as fs from "fs";
import * as cp from "child_process";
import * as cron from "node-cron";
import * as axios from "axios";
import { Commander } from "./commander";
import * as config from "../config.json";
import minimist from "minimist";

const argv = minimist(process.argv.slice(2));

/**
 * @class App
 * @description
 * 리눅스에서의 각종 명령을 제어하는 진입점(EntryPoint) 클래스입니다.
 */
class App {
  /**
   * 앱을 실행합니다.
   */
  start() {
    if (!argv.container) {
      console.log("--container is not passed");
    }

    this.truncateLogFile(argv.container);
  }

  /**
   * 파일 크기를 0으로 만듭니다.
   *
   * @param {String} container_name
   */
  truncateLogFile(container_name: string) {
    switch (process.platform) {
      case "linux":
        this.handleActionOnLinux(container_name);
        break;
      default:
        console.warn("지원하지 않는 운영체제입니다.");
    }
  }

  /**
   * 리눅스에서의 액션을 처리합니다.
   *
   * @param container_name {string}
   */
  handleActionOnLinux(container_name: string) {
    try {
      const logFileCommand = Commander.getLogFileCommand(container_name);
      const raw = cp.execSync(logFileCommand);
      const data = JSON.parse("{" + raw.toString("utf-8") + '"tracks":[]}');
      if ("LogPath" in data) {
        const logFile = data.LogPath;
        fs.truncateSync(logFile, 0);
        console.log("작업이 완료되었습니다");
      }
    } catch (e) {
      console.warn(e);
      console.log("handleActionOnLinux() 중에 오류가 발생하였습니다.");
    }
  }

  copyLogFile(container_name: string, content: string) {
    /**
     * @type {string}
     */
    const targetFolder = config.targetFolder;

    if (!fs.existsSync(targetFolder)) {
      throw new Error(
        "the key named 'targetFolder' can't be found in your system."
      );
    }
  }
}

const app = new App();
app.start();

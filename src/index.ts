import * as path from "path";
import * as fs from "fs";
import * as cp from "child_process";
import * as cron from "node-cron";
import * as axios from "axios";
import { Commander } from "./commander";
import * as config from "../config.json";
import minimist from "minimist";
import moment from "moment";
import { v4 } from "uuid";

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
    if (argv.container) {
      this.truncateLogFile(argv.container);
    } else if (argv.all) {
      const containerList = this.getContainerList();
      for (const container of containerList) {
        this.truncateLogFile(container);
      }
    }
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
        this.copyLogFileAsTargetFolder(logFile, container_name);
        this.eraseLog(logFile);
        console.log(`[${container_name}] 작업이 완료되었습니다`);
      }
    } catch (e) {
      console.warn(e);
      console.log("handleActionOnLinux() 중에 오류가 발생하였습니다.");
    }
  }

  /**
   * 루트 권한을 가지고 있는지 확인합니다.
   * @returns
   */
  isRootAuthority() {
    return process.getuid() === 0;
  }

  /**
   * 로그 파일의 내용을 제거합니다.
   * @param logFilePath
   */
  eraseLog(logFilePath: string) {
    fs.truncateSync(logFilePath, 0);
  }

  /**
   * 도커 컨테이너 목록을 뽑아냅니다.
   *
   * @returns {string[]}
   */
  getContainerList() {
    const containerListCommand = Commander.getDockerContainerList();
    const raw = cp.execSync(containerListCommand, {
      encoding: "utf-8",
    });
    const lines = raw
      .split(/[\r\n]+/)
      .filter((line) => line.length > 0)
      .map((line) => line.trim());

    return lines;
  }

  /**
   * 로그 파일을 복제합니다.
   *
   * @param logFilePath {string} 로그 파일의 경로를 기입하세요.
   */
  copyLogFileAsTargetFolder(logFilePath: string, container_name: string) {
    /**
     * @type {string}
     */
    const targetFolder = config.targetFolder;

    if (!this.isRootAuthority()) {
      throw new Error("root 권한이 없습니다");
    }

    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder);
    }

    // 로그 파일명
    const baseId = v4();
    const containerName = container_name;
    const targetFileBaseName =
      `${containerName}-` +
      moment().format(`YYYY-MM-DD-HH-mm-ss`) +
      `-${baseId}` +
      ".log";

    if (fs.existsSync(logFilePath)) {
      const content = fs.readFileSync(logFilePath, "utf-8");
      const resultFilePath = path.join(targetFolder, targetFileBaseName);
      fs.writeFileSync(resultFilePath, content, {
        encoding: "utf-8",
      });
    }
  }
}

if (argv.cron) {
  // 크론 모드로 프로세스를 실행합니다.
  const app = new App();
  const MINUTE_INTERVAL = "0 */1 * * * *";
  const DAILY_INTERVAL = "0 0 * * *";
  cron.schedule(DAILY_INTERVAL, () => {
    app.start();
  });
} else if (argv.d) {
  // 데몬 프로세스로 실행되고 프로세스가 끝남
  const subprocess = cp.spawn(
    `npx`,
    ["ts-node", `${__dirname}/../src/index.ts`, "--cron", "--all"],
    {
      stdio: "ignore",
      detached: true,
    }
  );
  subprocess.unref();
} else {
  // 일반 모드로 실행 (프로세스가 끝나지 않음)
  const app = new App();

  // 스케줄 모드 추가
  app.start();
}

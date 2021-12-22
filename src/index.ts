import * as path from "path";
import * as fs from "fs";
import * as cp from "child_process";
import * as cron from "node-cron";
import * as axios from "axios";
import { Commander } from "./commander";
import minimist from "minimist";
import moment from "moment";
import { v4 } from "uuid";
import chalk from "chalk";
import { getConfig } from "./config";
const config = getConfig();

const argv = minimist(process.argv.slice(2));

interface FileStat {
  name: string;
  modifyTime: number;
}

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
        this.removeOldLogFiles();
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

  /**
   * 오래된 파일을 재귀적으로 찾습니다.
   * @param rootFolder
   * @param list
   */
  findOldLogFiles(rootFolder: string, list: FileStat[]) {
    let target = fs.readdirSync(config.targetFolder, {
      encoding: "utf-8",
    });

    target.forEach((subDirectory) => {
      const subFolder = path.join(rootFolder, subDirectory);
      const stat = fs.statSync(subFolder);
      if (stat.isDirectory()) {
        this.findOldLogFiles(subFolder, list);
      } else {
        list.push(<FileStat>{
          name: subDirectory,
          modifyTime: stat.mtime.getTime(),
        });
      }
    });
  }

  /**
   * 파일의 수정 시간으로 정렬한 후, 한 달전 시간으로 필터링합니다.
   * @param list
   * @returns
   */
  sortByModifyTime(list: FileStat[]) {
    // 1,2,4,5,6 순서로 정렬
    list.sort((a, b) => {
      return a.modifyTime - b.modifyTime;
    });

    // 한 달전으로 필터링
    const filterTime = moment()
      .subtract(config.oldFileDeleteDays, "d")
      .toDate()
      .getTime();
    list = list.filter((item) => {
      return item.modifyTime < filterTime;
    });

    return list;
  }

  /**
   * 한 달전 파일을 리스트에서 제거합니다.
   */
  removeOldLogFiles() {
    let list = <FileStat[]>[];
    this.findOldLogFiles(config.targetFolder, list);
    list = this.sortByModifyTime(list);

    list.forEach((file) => {
      const filePath = path.join(config.targetFolder, file.name);
      fs.unlinkSync(filePath);
      console.log(
        chalk.yellow(`${JSON.stringify(file)}을 제거하였습니다.`) +
          chalk.reset("")
      );
    });
  }
}

if (process.platform !== "linux" && !argv.test) {
  console.log(chalk.red("지원하지 않는 운영체제입니다."));
  process.exit();
}

console.log(chalk.yellow("작업을 시작합니다."));

if (argv.cron) {
  // 크론 모드로 프로세스를 실행합니다.
  const app = new App();
  let interval = "0 0 * * *";

  switch (config.interval) {
    case "minutely": // 분 단위
      interval = "0 */1 * * * *";
      break;
    case "hourly": // 시간 단위
      interval = "0 0 */1 * * *";
      break;
    default:
    case "daily": // 일 단위
      interval = "0 0 * * *";
      break;
    case "weekly": // 주 단위
      interval = "0 0 * * 0";
      break;
    case "monthly": // 월 단위
      interval = "0 0 1 * *";
      break;
  }
  cron.schedule(interval, () => {
    app.start();
  });
} else if (argv.d) {
  // 데몬 프로세스로 실행되고 프로세스가 끝남
  const subprocess = cp.spawn(
    `npx`,
    // !: 경로 문제로 start.sh가 실행되지 않음
    ["ts-node", `${__dirname}/../src/index.ts`, "--cron", "--all"],
    {
      stdio: "ignore",
      detached: true,
    }
  );
  subprocess.unref();
} else if (argv.test) {
  const app = new App();
  app.removeOldLogFiles();
} else {
  // 일반 모드로 실행 (프로세스가 끝나지 않음)
  const app = new App();

  // 스케줄 모드 추가
  app.start();
}

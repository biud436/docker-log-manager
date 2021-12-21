export const Commander = {
  getLogFileCommand: (container_name: string) =>
    `docker inspect ${container_name} | grep LogPath`,
  getDockerContainerList: () => {
    `docker container ps --format "{{.Names}}"`;
  },
};

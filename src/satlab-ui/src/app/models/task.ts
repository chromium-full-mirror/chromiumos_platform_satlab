export type DownloadJobTaskStatus =
  | 'IDLE'
  | 'LOADING'
  | 'PENDING'
  | 'DOWNLOADING'
  | 'ZIPPING'
  | 'UPLOADING'
  | 'COMPLETED'
  | 'FAILED';

export interface IDownloadJobTaskResponse {
  taskId: string;
}

export type ICheckDownloadJobLogStatusResponse = {
  status: DownloadJobTaskStatus;
  errMsg: string;
};

export interface ITask {
  id: string;
  status: DownloadJobTaskStatus;
}

export interface IJobLogLinkResponse {
  link: string;
}

export interface IDownloadTask {
  id: string;
  status: DownloadJobTaskStatus;
  updatedTime: Date;
}

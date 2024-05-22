import {Moment} from 'moment';

export type JobStatus =
  | 'STATUS_NOT_SET'
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETE' // Job ran and completed normally irrespective of swarming task exit code. This should be sure for CTP (suite/testplan) tasks, as these task don't indicate actual test status.
  | 'TIMEOUT' // Job ran longer than allowed time
  | 'EXPIRED' // Job never ran due to lack of bot availability
  | 'ABORTED'; // Job manually cancelled or killed or aborted

export type JobHeader =
  | 'select'
  | 'empty'
  | 'id'
  | 'name'
  | 'board'
  | 'model'
  | 'build'
  | 'createdAt'
  | 'startedAt'
  | 'finishedAt'
  | 'status'
  | 'parentJobID'
  | 'hostname'
  | 'pool'
  | 'satlabID'
  | 'luciLink'
  | 'testResults'
  | 'cpconLink';

export interface JobColumn {
  header: string;
  def: JobHeader;
  type: 'string' | 'date' | 'link' | 'empty' | 'checkbox';
  actions?: LinkAction[];
}

export interface LinkAction {
  getLink: (job: IJob) => string;
  icon?: string;
  img?: string;
  tooltip: string;
}

export interface IJob {
  id: string;
  name: string;
  board: string;
  model: string;
  build: string;
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
  status: JobStatus;
  parentJobID?: string;
  hostname: string;
  pool: string;
  satlabID: string;
  taskUrl: string;
  resultUrl: string;
  cpconUrl: string;
  completeJobPercentage?: number;
}

export interface IJobResponse {
  token: string;
  jobs: IJob[];
}

export type RequestStateQuery =
  | 'ALL'
  | 'PENDING'
  | 'RUNNING'
  | 'PENDING_RUNNING'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'TIMEOUT'
  | 'CANCELLED';

export type JobSortBy =
  | 'CREATE_TS'
  | 'COMPLETE_TS'
  | 'ABANDONED_TS'
  | 'STARTED_TS';

// TYPE_NOT_SET = SUITE & TESTPLAN
export type JobType = 'ALL' | 'SUITE' | 'TESTPLAN' | 'TEST';

export type JobTagKey =
  | 'label-pool'
  | 'satlab-id'
  | 'label-suite'
  | 'buildbucket_build_id'
  | 'builder'
  | 'display_name'
  | 'dut_name'
  | 'parent_buildbucket_id'
  | 'suite'
  | 'testplan'
  | 'test-plan-id'
  | 'test-type';

export type JobTags = {
  [K in JobTagKey]?: string;
};

export interface IJobQuery {
  createdDateGt?: Moment;
  createdDateLt?: Moment;
  jobType?: JobType;
  sortBy?: JobSortBy;
  statusQuery?: RequestStateQuery;
  pageToken?: string;
  tags?: JobTags;
  pageSize: number;
}

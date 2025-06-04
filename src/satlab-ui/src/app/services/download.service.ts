import {Injectable} from '@angular/core';
import {SatlabRpcService} from './satlab-rpc.service';
import {BehaviorSubject, from, Observable, tap, timer} from 'rxjs';
import {startWithTap} from 'app/utils/rxjs_operator';
import {DownloadJobTaskStatus, IDownloadTask} from 'app/models/task';
import {
  CHECK_DOWNLOAD_TASK_THRESHOLD,
  DOWNLOAD_SERVICE_TIMER,
} from 'app/constants';

@Injectable({
  providedIn: 'root',
})
export class DownloadService {
  public downloadTask$: Observable<Record<string, IDownloadTask>>;
  private __downloadTasksSubject = new BehaviorSubject<
    Record<string, IDownloadTask>
  >({});

  constructor(private satlab_rpcserver: SatlabRpcService) {
    this.downloadTask$ = this.__downloadTasksSubject.asObservable();
    timer(0, DOWNLOAD_SERVICE_TIMER).subscribe(() => {
      this.autoUpdateTasks();
    });
    this.refreshDownloadTasks();
  }

  public createDownloadJobTask(id: string) {
    return from(this.satlab_rpcserver.downloadJob(id)).pipe(
      startWithTap(() => {
        this.updateTask(id, 'LOADING');
      }),
      tap({
        complete: () => {
          this.updateTask(id, 'PENDING');
        },
        error: () => {
          this.updateTask(id, 'IDLE');
        },
      })
    );
  }

  /*
   * Updates the status of a specific download task and notifies all subscribers.
   */
  private updateTask(id: string, status: DownloadJobTaskStatus) {
    const currentRecord = this.__downloadTasksSubject.getValue();
    const task: IDownloadTask = {
      id: id,
      status: status,
      updatedTime: new Date(),
    };

    this.__downloadTasksSubject.next({
      ...currentRecord,
      [id]: task,
    });
  }

  /*
   * Delete a specific download task and notifies all subscribers.
   */
  private deleteTask(id: string) {
    const current = this.__downloadTasksSubject.getValue();
    const {[id]: _, ...rest} = current;
    this.__downloadTasksSubject.next(rest);
  }

  /*
   * autoUpdateTasks updates the task status every 5 seconds.
   */
  private autoUpdateTasks() {
    const now = Date.now();
    const tasks = this.__downloadTasksSubject.getValue();

    Object.values(tasks).forEach(task => {
      if (task.status !== 'COMPLETED') {
        const updateTime = task.updatedTime.getTime();
        const elapsed = now - updateTime;

        if (elapsed >= CHECK_DOWNLOAD_TASK_THRESHOLD) {
          this.checkTaskStatus(task.id).subscribe({
            next: ts => {
              if (ts.status !== task.status) {
                this.updateTask(task.id, ts.status);
              }
            },
            error: () => {
              this.deleteTask(task.id);
            },
          });
        }
      }
    });
  }

  public checkTaskStatus(id: string) {
    return from(this.satlab_rpcserver.checkDownloadJobLogStatus(id));
  }

  public listJobDownloadingTasks() {
    return from(this.satlab_rpcserver.listJobLogTasks());
  }

  /**
   * Fetches the current list of downloading tasks from the backend
   * and replaces the entire local task map with the latest data.
   */
  public refreshDownloadTasks() {
    this.listJobDownloadingTasks().subscribe(res => {
      const taskMap: Record<string, IDownloadTask> = {};
      res.forEach(r => {
        taskMap[r.id] = {
          id: r.id,
          status: r.status,
          updatedTime: new Date(),
        };
      });
      this.__downloadTasksSubject.next(taskMap);
    });
  }

  public getJobLogLink(id: string) {
    return from(this.satlab_rpcserver.jobLogLink(id)).pipe(
      startWithTap(() => {
        this.updateTask(id, 'LOADING');
      }),
      tap({
        complete: () => {
          this.updateTask(id, 'COMPLETED');
        },
        error: () => {
          this.updateTask(id, 'IDLE');
        },
      })
    );
  }
}

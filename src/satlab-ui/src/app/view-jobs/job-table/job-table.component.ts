import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import {IJob, IJobQuery, JobColumn, JobHeader} from 'app/models/job';
import {toIterator} from 'app/utils/iterator';
import {SatlabRpcService} from '../../services/satlab-rpc.service';
import {NotificationService} from '../../services/notification.service';
import {finalize, from, map} from 'rxjs';
import {startWithTap} from '../../utils/rxjs_operator';

const ALL_COLUMNS: JobHeader[] = [
  'empty',
  'id',
  'name',
  'createdAt',
  'startedAt',
  'finishedAt',
  'status',
  'parentJobID',
  'hostname',
  'pool',
  'satlabID',
  'links',
];

const DEFAULT_COLUMNS: JobHeader[] = [
  'empty',
  'name',
  'createdAt',
  'startedAt',
  'finishedAt',
  'status',
  'links',
];

const COLUMN_OPTIONS = ALL_COLUMNS.slice(1);

@Component({
  selector: 'app-job-table',
  templateUrl: './job-table.component.html',
  styleUrls: ['./job-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobTableComponent implements OnChanges {
  @Input() query?: IJobQuery;
  #query: IJobQuery;

  /* loadingChange is the event emitter that indicates the loading of fetching jobs */
  @Output() loadingChange = new EventEmitter<boolean>();

  /* jobs  is the data that we want to show. */
  protected jobs: IJob[] = [];
  /* displayedColumns is the default columns that we want to show. */
  protected displayedColumns: JobHeader[] = DEFAULT_COLUMNS;
  /* columns is the columns for rendering */
  protected columns: JobColumn[] = [];
  /* column options are the options that a user wants to select to display */
  protected columnOptions: string[] = COLUMN_OPTIONS;
  /* A flag indicate that we have more data */
  protected hasMore = false;
  /* the flag shows the loading */
  protected loading = false;
  /* A config that we want to fetch the next page */
  #paginationThreshold = 50;
  /* A flag that indicates the column selection is showing */
  protected isColumnSelectionShown = false;

  constructor(
    private service: SatlabRpcService,
    private notificationService: NotificationService,
    private cdf: ChangeDetectorRef
  ) {
    this.#toColumns();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes);
    if (
      'query' in changes &&
      changes.query.currentValue &&
      changes.query.currentValue !== changes.query.previousValue
    ) {
      this.jobs = [];
      this.hasMore = true;
      this.#query = changes.query.currentValue;
      this.nextPage();
    }
  }

  /**
   * nextPage is the event handler handles that the user wants to more data.
   */
  protected nextPage() {
    console.log('call next page');
    console.log(`has more: ${this.hasMore}`);
    if (!this.hasMore) {
      return;
    }

    from(this.service.listJobs(this.#query))
      .pipe(
        startWithTap(() => {
          this.loading = true;
          this.cdf.detectChanges();
          this.loadingChange.emit(this.loading);
        }),
        finalize(() => {
          this.loading = false;
          this.cdf.detectChanges();
          this.loadingChange.emit(this.loading);
        }),
        map(resp => {
          this.hasMore = resp.token && resp.token !== '';
          this.#query = {
            ...this.#query,
            pageToken: resp.token,
          };
          return resp.jobs;
        })
      )
      .subscribe({
        next: jobs => {
          this.jobs = [...this.jobs, ...jobs];
        },
        error: e => {
          this.notificationService.error(
            `can not fetch jobs, got an error: ${e}`
          );
        },
      });
  }

  /**
   * onTableScroll is the event handler handles the job table scroll event
   * to decide we want to load more data.
   */
  protected onTableScroll(e: Event) {
    const containerHeight = (e.target as HTMLElement).offsetHeight;
    const tableScrollHeight = (e.target as HTMLElement).scrollHeight;
    const scrollOffset = (e.target as HTMLElement).scrollTop;

    const limit =
      tableScrollHeight - containerHeight - this.#paginationThreshold;

    if (scrollOffset > limit) {
      this.nextPage();
    }
  }

  /**
   * toggleColumn is the event handler handles which column that user
   * wants to show.
   */
  protected toggleColumn(checked: boolean, label: JobHeader) {
    if (checked && !this.displayedColumns.includes(label)) {
      const idx = COLUMN_OPTIONS.indexOf(label);

      let k = 0;
      for (const l of this.displayedColumns) {
        const i = COLUMN_OPTIONS.indexOf(l);
        if (i > idx) {
          break;
        }

        k++;
      }

      this.displayedColumns = [
        ...this.displayedColumns.slice(0, k),
        label,
        ...this.displayedColumns.slice(k),
      ];

      this.#toColumns();
    } else if (!checked && this.displayedColumns.includes(label)) {
      const idx = this.displayedColumns.indexOf(label);
      this.displayedColumns = [
        ...this.displayedColumns.slice(0, idx),
        ...this.displayedColumns.slice(idx + 1),
      ];

      this.#toColumns();
    }
  }

  /**
   * columnSelectionChanged is the event handler handles that a user click on the `list` icon.
   */
  protected columnSelectionChanged(e: PointerEvent) {
    e.stopPropagation();
    this.isColumnSelectionShown = !this.isColumnSelectionShown;
  }

  /**
   * closeColumnSelection close the column selection window when the user clicks on outside area.
   */
  protected closeColumnSelection(e: PointerEvent) {
    e.stopPropagation();
    this.isColumnSelectionShown = false;
  }

  /**
   * Mapping the display columns to columns for each row.
   * @private
   */
  #toColumns() {
    this.columns = toIterator(this.displayedColumns)
      .map(headerToColumn)
      .collect();
  }
}

function headerToColumn(header: JobHeader): JobColumn {
  switch (header) {
    case 'empty':
      return {header: '', def: 'empty', type: 'empty'};
    case 'id':
      return {header: 'ID', def: 'id', type: 'string'};
    case 'name':
      return {header: 'Name', def: 'name', type: 'string'};
    case 'createdAt':
      return {header: 'Created At', def: 'createdAt', type: 'date'};
    case 'startedAt':
      return {header: 'Started At', def: 'startedAt', type: 'date'};
    case 'finishedAt':
      return {header: 'Finished At', def: 'finishedAt', type: 'date'};
    case 'status':
      return {header: 'Status', def: 'status', type: 'string'};
    case 'parentJobID':
      return {header: 'Parent Job ID', def: 'parentJobID', type: 'string'};
    case 'hostname':
      return {header: 'Hostname', def: 'hostname', type: 'string'};
    case 'pool':
      return {header: 'Pool', def: 'pool', type: 'string'};
    case 'satlabID':
      return {header: 'Satlab ID', def: 'satlabID', type: 'string'};
    case 'links':
      return {
        header: 'Result Links',
        def: 'links',
        type: 'link',
        actions: [
          {
            getLink: j => j.taskUrl,
            img: 'https://storage.googleapis.com/chrome-infra/lucy-small.png',
            tooltip: 'LUCI link',
          },
          {
            getLink: j => j.resultUrl,
            icon: 'link',
            tooltip: 'Testhouse link',
          },
        ],
      };
  }
}

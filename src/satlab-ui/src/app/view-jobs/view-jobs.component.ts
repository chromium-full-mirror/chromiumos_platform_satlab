import {IJob, IJobQuery, JobType, RequestStateQuery} from '../models/job';
import {SatlabRpcService} from '../services/satlab-rpc.service';
import {BehaviorSubject, Subject, from} from 'rxjs';
import {IItem} from '../models/selectable_item';
import {toIterator} from 'app/utils/iterator';
import {withinDays, toEndDate, toStartDate} from 'app/utils/date_helper';
import {NotificationService} from 'app/services/notification.service';
import * as moment from 'moment';
import {CustomDatepickerComponent} from 'app/custom-datepicker/custom-datepicker.component';
import {AutocompleteSelectorComponent} from 'app/run_suite/common/autocomplete-selector/autocomplete-selector.component';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ViewChild,
} from '@angular/core';

function createDefaultJobQuery(
  id: string,
  createdDateGt: moment.Moment,
  createdDateLt: moment.Moment
): IJobQuery {
  return {
    pageSize: 20,
    createdDateGt: createdDateGt,
    createdDateLt: createdDateLt,
    jobType: 'SUITE',
    tags: {
      'satlab-id': id,
      'test-type': 'suite',
    },
  };
}

@Component({
    selector: 'app-view-jobs',
    templateUrl: './view-jobs.component.html',
    styleUrls: ['./view-jobs.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ViewJobsComponent implements AfterViewInit {
  @ViewChild('startDatepicker')
  startDatepicker?: CustomDatepickerComponent;
  @ViewChild('endDatepicker') endDatepicker?: CustomDatepickerComponent;
  @ViewChild('poolSelector') poolSelector?: AutocompleteSelectorComponent;

  protected maxDays = 30;
  protected dateRangeStart = toStartDate(moment()).subtract(
    this.maxDays,
    'days'
  );
  protected dateRangeEnd = toEndDate(moment());

  protected nameInput = '';
  protected query = createDefaultJobQuery(
    '',
    this.dateRangeStart,
    this.dateRangeEnd
  );
  private validateDate$ = new Subject<void>();
  protected jobQuery?: IJobQuery;
  protected canFilterName = false;
  #satlabID = new BehaviorSubject('');
  protected jobTypeOptions: IItem[] = [];
  protected statusOptions: IItem[] = [];
  protected jobType: JobType = 'SUITE';
  protected statusQuery = 'ALL';
  protected invalidDate = false;
  protected loading = false;
  protected poolOptions = [];
  protected selectedJobs: IJob[] = [];

  #status: RequestStateQuery[] = [
    'ALL',
    'PENDING',
    'RUNNING',
    'PENDING_RUNNING',
    'COMPLETED',
    'EXPIRED',
    'TIMEOUT',
    'CANCELLED',
  ];

  #jobTypes: JobType[] = ['SUITE', 'TESTPLAN', 'TEST'];

  constructor(
    private service: SatlabRpcService,
    private notificationService: NotificationService,
    private cdf: ChangeDetectorRef
  ) {
    this.jobTypeOptions = toIterator(this.#jobTypes)
      .map(toSelectItem)
      .collect();

    this.statusOptions = toIterator(this.#status).map(toSelectItem).collect();
  }

  ngAfterViewInit() {
    this.#getSatlabID();
    this.#getPoolOptions();
    this.#satlabID.subscribe({
      next: id => {
        if (id) {
          const q = createDefaultJobQuery(
            id,
            this.dateRangeStart,
            this.dateRangeEnd
          );

          this.jobQuery = {...q};
          this.query = {...q};
          if (this.query.jobType) {
            this.#updateCanFilterName(this.query.jobType);
          }
          this.cdf.detectChanges();
        }
      },
    });

    this.validateDate$.subscribe({
      next: () => {
        this.invalidDate = false;
        const lt = this.query.createdDateLt;
        const gt = this.query.createdDateGt;

        if (lt && lt > this.dateRangeEnd) {
          this.invalidDate = true;
          return;
        }

        this.invalidDate = !(gt && lt && withinDays(gt, lt, this.maxDays + 1));
      },
    });
  }

  /**
   * Get the Satlab ID from the backend.
   */
  #getSatlabID() {
    from(this.service.getVersionInfo()).subscribe({
      next: resp => {
        this.#satlabID.next(`satlab-${resp.hostId}`);
      },
      error: e => {
        this.notificationService.error(
          `can not fetch the satlab id, got an error: ${e}`
        );
      },
    });
  }

  /**
   * List all avaliable pools that make a suggestion list.
   */
  #getPoolOptions() {
    from(this.service.listEnrolledDUTs()).subscribe({
      next: resp => {
        this.poolOptions = toIterator(resp)
          .map(e => e.pools)
          .flatten()
          .unique_by()
          .map(toSelectItem)
          .collect();
      },
      error: e => {
        console.error(`can not fetch enrolled duts, got an error: ${e}`);
      },
    });
  }

  /**
   * onSatlabIDChanged is the event handler handles the Satlab ID changed.
   */
  protected onSatlabIDChanged(e: Event) {
    const newValue = (e.target as HTMLInputElement).value;
    if (!newValue) {
      delete this.query.tags?.['satlab-id'];
      return;
    }

    this.query = {
      ...this.query,
      tags: {
        ...this.query.tags,
        'satlab-id': newValue,
      },
    };
  }

  /**
   * onPoolChanged is the event handler handles the pool changed.
   */
  protected onPoolChanged(newValue: string) {
    if (!newValue) {
      delete this.query.tags?.['label-pool'];
      return;
    }
    this.query = {
      ...this.query,
      tags: {
        ...this.query.tags,
        'label-pool': newValue,
      },
    };
  }

  /**
   * onFromChanged is the event handler handles the created date changed.
   * if newValue is null, which means the user is changing the value or
   * the value can't parse to `Date`.
   */
  protected onFromChanged(newValue: moment.Moment | null) {
    this.query = {
      ...this.query,
      createdDateGt: newValue !== null ? toStartDate(newValue.clone()) : null,
    };

    this.validateDate$.next();
  }

  /**
   * onToChanged is the event handler handles the created date changed.
   * if newValue is null, which means the user is changing the value or
   * the value can't parse to `Date`.
   *
   */
  protected onToChanged(newValue: moment.Moment | null) {
    this.query = {
      ...this.query,
      createdDateLt: newValue !== null ? toEndDate(newValue.clone()) : null,
    };

    this.validateDate$.next();
  }

  /**
   * onLoadingChanged is the event handler handles fetching jobs.
   */
  protected onLoadingChanged(loading: boolean) {
    this.loading = loading;
    this.cdf.detectChanges();
  }

  /**
   * onJobTypeChanged is the event handler handles the job type changed.
   * if newValue is empty, it means the user wants to query all job types.
   * if user has selected `Suite` or `Testplan`, enables the inputbox of `Name`.
   */
  protected onJobTypeChanged(newValue: JobType) {
    this.query = {
      ...this.query,
      jobType: newValue,
      tags: {
        ...this.query.tags,
        ...(newValue === 'SUITE' && {'test-type': 'suite'}),
        ...(newValue === 'TESTPLAN' && {'test-type': 'testplan'}),
      },
    };

    if (newValue === 'ALL' || newValue === 'TEST') {
      delete this.query.tags?.['test-type'];
    }

    this.#updateCanFilterName(newValue);
  }

  /**
   * onJobStatusChanged is the event handler handles the job status query changed.
   */
  protected onJobStatusChanged(newValue: RequestStateQuery) {
    this.query = {
      ...this.query,
      statusQuery: newValue,
    };
  }

  /**
   * onNameChanged is the event handler handles the name changed.
   * @param e
   * @protected
   */
  protected onNameChanged(e: Event) {
    const newValue = (e.target as HTMLInputElement).value;
    if (!newValue) {
      delete this.query.tags?.['label-suite'];
      delete this.query.tags?.['test-plan-id'];
      return;
    }

    this.query = {
      ...this.query,
      tags: {
        ...this.query.tags,
        ...(this.query.jobType === 'SUITE' && {'label-suite': newValue}),
        ...(this.query.jobType === 'TESTPLAN' && {'test-plan-id': newValue}),
      },
    };
  }

  /**
   * onFilterClicked is the event handler handles the filter button clicked.
   * it applies the query to new query and fetch the jobs.
   */
  protected onFilterClicked() {
    this.jobQuery = {...this.query};
  }

  /**
   * onClearClicked is the event handler handles the clear button clicked
   * it reset the query parameter and fetch the jobs.
   */
  protected onClearClicked() {
    this.startDatepicker?.reset(this.dateRangeStart);
    this.endDatepicker?.reset(this.dateRangeEnd);
    this.nameInput = '';
    this.poolSelector?.clear();
    this.jobType = 'SUITE';
    this.statusQuery = 'ALL';
    const q = createDefaultJobQuery(
      this.#satlabID.value,
      this.dateRangeStart,
      this.dateRangeEnd
    );

    this.query = {...q};
    this.jobQuery = {...q};
    if (this.query.jobType) {
      this.#updateCanFilterName(this.query.jobType);
    }
  }

  protected onJobSelected(j: IJob[]) {
    this.selectedJobs = j;
  }

  protected onAbortClicked() {
    if (!confirm(`Do you want to abort ${this.selectedJobs.length} job(s)?`)) {
      return;
    }
    from(
      this.service.abort({
        ids: toIterator(this.selectedJobs)
          .map(j => j.id)
          .collect(),
        type: this.jobQuery.jobType,
      })
    ).subscribe({
      next: () => {
        this.notificationService.info(
          `Aborting ${this.selectedJobs.length} job(s) now, please refresh the page.`
        );
      },
      error: e => {
        this.notificationService.error(
          `Failed to abort job(s), got an error: ${e}`
        );
      },
    });
  }

  #updateCanFilterName(jobType: JobType) {
    this.canFilterName = jobType === 'SUITE' || jobType === 'TESTPLAN';
  }
}

function toSelectItem(text: string): IItem {
  return {
    text: text,
    value: text,
    label: '',
  };
}

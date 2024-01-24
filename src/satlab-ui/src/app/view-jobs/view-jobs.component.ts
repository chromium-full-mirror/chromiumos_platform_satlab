import * as core from '@angular/core';
import {IJobQuery, JobType, RequestStateQuery} from '../models/job';
import {SatlabRpcService} from '../services/satlab-rpc.service';
import {BehaviorSubject, from} from 'rxjs';
import {IItem} from '../models/selectable_item';
import {toIterator} from 'app/utils/iterator';
import {withinDays, toEndDate, toStartDate} from 'app/utils/date_helper';
import {NotificationService} from 'app/services/notification.service';
import * as moment from 'moment';
import {CustomDatepickerComponent} from 'app/custom-datepicker/custom-datepicker.component';

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
    },
  };
}

@core.Component({
  selector: 'app-view-jobs',
  templateUrl: './view-jobs.component.html',
  styleUrls: ['./view-jobs.component.scss'],
  changeDetection: core.ChangeDetectionStrategy.OnPush,
})
export class ViewJobsComponent implements core.AfterViewInit {
  @core.ViewChild('startDatepicker')
  startDatepicker?: CustomDatepickerComponent;
  @core.ViewChild('endDatepicker') endDatepicker?: CustomDatepickerComponent;

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
  protected jobQuery?: IJobQuery;
  protected canFilterName = false;
  #satlabID = new BehaviorSubject('');
  protected jobTypeOptions: IItem[] = [];
  protected statusOptions: IItem[] = [];
  protected jobType: JobType = 'SUITE';
  protected statusQuery = 'ALL';
  protected disabled = false;
  protected loading = false;
  protected poolOptions = [];

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
    private cdf: core.ChangeDetectorRef
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
          this.cdf.detectChanges();
        }
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
    if (newValue === null) {
      newValue = this.dateRangeStart.clone();
    }

    this.query = {
      ...this.query,
      createdDateGt: toStartDate(newValue.clone()),
    };

    if (this.query.createdDateLt) {
      this.disabled = !withinDays(
        this.query.createdDateGt,
        this.query.createdDateLt,
        this.maxDays + 1
      );
    }
  }

  /**
   * onToChanged is the event handler handles the created date changed.
   * if newValue is null, which means the user is changing the value or
   * the value can't parse to `Date`.
   *
   */
  protected onToChanged(newValue: moment.Moment | null) {
    if (newValue === null) {
      newValue = this.dateRangeEnd.clone();
    }

    this.query = {
      ...this.query,
      createdDateLt: toEndDate(newValue.clone()),
    };

    if (this.query.createdDateGt) {
      this.disabled = !withinDays(
        this.query.createdDateGt,
        this.query.createdDateLt,
        this.maxDays + 1
      );
    }
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
    this.startDatepicker?.clear();
    this.endDatepicker?.clear();
    this.nameInput = '';
    this.jobType = 'SUITE';
    this.statusQuery = 'ALL';
    const q = createDefaultJobQuery(
      this.#satlabID.value,
      this.dateRangeStart,
      this.dateRangeEnd
    );

    this.query = {...q};
    this.jobQuery = {...q};
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

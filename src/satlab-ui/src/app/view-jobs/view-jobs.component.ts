import * as core from '@angular/core';
import {IJobQuery, JobType, RequestStateQuery} from '../models/job';
import {SatlabRpcService} from '../services/satlab-rpc.service';
import {BehaviorSubject, from} from 'rxjs';
import {IItem} from '../models/selectable_item';
import {toIterator} from 'app/utils/iterator';
import {withinDays} from 'app/utils/date_helper';
import {NotificationService} from 'app/services/notification.service';
import * as moment from 'moment';
import {CustomDatepickerComponent} from 'app/custom-datepicker/custom-datepicker.component';

function createDefaultJobQuery(id: string): IJobQuery {
  return {
    pageSize: 20,
    tags: {
      'satlab-id': id,
    },
  };
}

@core.Component({
  selector: 'app-view-jobs',
  templateUrl: './view-jobs.component.html',
  styleUrls: ['./view-jobs.component.scss'],
})
export class ViewJobsComponent implements core.AfterViewInit {
  @core.ViewChild('startDatepicker')
  startDatepicker?: CustomDatepickerComponent;
  @core.ViewChild('endDatepicker') endDatepicker?: CustomDatepickerComponent;

  protected nameInput = '';
  protected query = createDefaultJobQuery('');
  protected jobQuery?: IJobQuery;
  protected canFilterName = false;
  #satlabID = new BehaviorSubject('');
  protected jobTypeOptions: IItem[] = [];
  protected statusOptions: IItem[] = [];
  protected jobType = 'ALL';
  protected statusQuery = 'ALL';
  protected disabled = false;

  #status: RequestStateQuery[] = [
    'ALL',
    'PENDING',
    'RUNNING',
    'PENDING_RUNNING',
    'COMPLETED',
    'COMPLETE_SUCCESS',
    'COMPLETE_FAILURE',
    'EXPIRED',
    'TIMEOUT',
    'CANCELLED',
  ];

  #jobTypes: string[] = ['ALL', 'SUITE', 'TESTPLAN', 'TEST'];

  constructor(
    private service: SatlabRpcService,
    private notificationService: NotificationService
  ) {
    this.jobTypeOptions = toIterator(this.#jobTypes)
      .map(toSelectItem)
      .collect();

    this.statusOptions = toIterator(this.#status).map(toSelectItem).collect();
  }

  ngAfterViewInit() {
    this.#getSatlabID();
    this.#satlabID.subscribe({
      next: id => {
        if (id) {
          this.jobQuery = createDefaultJobQuery(id);
          this.query = createDefaultJobQuery(id);
        }
      },
    });
  }

  /**
   * Get the Satlab ID from the backend.
   * @private
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
  protected onPoolChanged(e: Event) {
    const newValue = (e.target as HTMLInputElement).value;
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
      delete this.query.createdDateGt;
      return;
    }

    this.query = {
      ...this.query,
      createdDateGt: newValue,
    };

    if (this.query.createdDateLt) {
      this.disabled = !withinDays(newValue, this.query.createdDateLt, 30);
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
      delete this.query.createdDateLt;
      return;
    }

    this.query = {
      ...this.query,
      createdDateLt: newValue,
    };

    if (this.query.createdDateGt) {
      this.disabled = !withinDays(this.query.createdDateGt, newValue, 30);
    }
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
    this.jobType = 'ALL';
    this.statusQuery = 'ALL';
    this.query = createDefaultJobQuery(this.#satlabID.value);
    this.jobQuery = createDefaultJobQuery(this.#satlabID.value);
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

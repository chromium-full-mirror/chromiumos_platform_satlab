import {TableCellComponent} from '../../common/table-cell/table-cell.component';
import {CommonModule} from '@angular/common';
import {
  Component,
  EffectRef,
  OnDestroy,
  OnInit,
  WritableSignal,
  computed,
  signal,
} from '@angular/core';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {AndroidService} from 'app/services/android.service';
import {NotificationService} from 'app/services/notification.service';
import {wrapperLoading} from 'app/utils/operators';
import {from} from 'rxjs';

@Component({
  selector: 'app-auto-qual',
  standalone: true,
  imports: [CommonModule, TableCellComponent, MatProgressSpinnerModule],
  templateUrl: './auto-qual.component.html',
  styleUrls: ['./auto-qual.component.scss'],
})
export class AutoQualComponent implements OnInit, OnDestroy {
  protected readonly ALL_COLUMNS = [
    'id',
    'target',
    'buildID',
    'pool',
    'createdAt',
    'status',
    'resultsLink',
  ];
  protected isLoading = signal<{show: boolean; message: string}>({
    show: false,
    message: '',
  });

  protected selectedColumns = signal<string[]>([...this.ALL_COLUMNS]);
  protected displayedColumns = computed(() => {
    return this.ALL_COLUMNS.filter(col => this.selectedColumns().includes(col));
  });
  protected testRecords = signal<AutoQualTestRecord[]>([]);
  protected isMenuOpen = signal<boolean>(false);
  protected isLinkColumn = (col: string) => ['resultsLink'].includes(col);

  private readonly PAGE_SIZE = 20;
  private readonly SCROLL_BOTTOM_DIFF = 5;
  private pageToken = signal<string>('');
  private isEndOfList = signal<boolean>(false);
  private readonly STATE_MAPPING: Record<number, string> = {
    0: 'STATE_UNSPECIFIED',
    1: 'CREATED',
    2: 'INCOMPLETE',
    3: 'FAILED',
    4: 'UNREPORTED',
    5: 'NOT_APPLICABLE',
    6: 'SUCCEEDED',
    7: 'CANCEL_REQUESTED',
    8: 'CANCELLED',
    9: 'CANCEL_FAILED',
  };

  private refs: EffectRef[] = [];

  constructor(
    private androidService: AndroidService,
    private notification: NotificationService
  ) {}

  ngOnInit() {
    this.__listTestEfforts(this.PAGE_SIZE, this.pageToken());
  }

  ngOnDestroy(): void {
    this.refs.forEach(ref => ref.destroy());
  }

  protected trackById(_: number, record: AutoQualTestRecord) {
    return record.id();
  }
  protected trackByCol(_: number, col: string) {
    return col;
  }

  protected columnNameMapping(col: string): string {
    const mapping: Record<string, string> = {
      id: 'ID',
      target: 'Target',
      buildID: 'Build ID',
      pool: 'Pool',
      createdAt: 'Created At',
      status: 'Status',
      progress: 'Progress',
      jobLink: 'Job Link',
      resultsLink: 'Results Link',
    };
    return mapping[col] || col;
  }

  protected toggleMenu() {
    this.isMenuOpen.update(open => !open);
  }

  protected toggleColumn(col: string) {
    this.selectedColumns.update(cur => {
      return cur.includes(col) ? cur.filter(c => c !== col) : [...cur, col];
    });
  }

  protected onScroll(event: Event) {
    const element = event.target as HTMLElement;
    const isBottom =
      element.scrollHeight - element.scrollTop <=
      element.clientHeight + this.SCROLL_BOTTOM_DIFF;

    if (isBottom && !this.isEndOfList() && !this.isLoading().show) {
      console.log(this.pageToken());
      this.__listTestEfforts(this.PAGE_SIZE, this.pageToken());
    }
  }

  private __listTestEfforts(pageSize: number, pageToken: string) {
    wrapperLoading(
      from(this.androidService.listTestEfforts(pageSize, pageToken)),
      this.isLoading,
      'Loading test efforts...'
    ).subscribe({
      next: e => {
        const token = e.getNextPageToken();
        this.pageToken.set(token);
        this.isEndOfList.set(!token);
        this.testRecords.set([
          ...this.testRecords(),
          ...e.getEffortsList().map(eff => ({
            id: signal(eff.getId()),
            target: signal(
              eff.getBoard() && eff.getModel()
                ? `${eff.getBoard()}/${eff.getModel()}`
                : ''
            ),
            buildID: signal(eff.getAndroid()?.getBuildId() || ''),
            pool: signal(eff.getPoolsList().join(',')),
            createdAt: signal(eff.getCreatedAt()?.toDate() || null),
            status: signal(this.STATE_MAPPING[eff.getState()] || 'UNKNOWN'),
            resultsLink: signal(eff.getTesthausUrl()),
          })),
        ]);
      },
      error: err => {
        this.notification.error(`Lst Test Efforts failed: ${err}`, {
          dismiss: false,
        });
      },
    });
  }
}

interface AutoQualTestRecord {
  id: WritableSignal<string>;
  target: WritableSignal<string>;
  buildID: WritableSignal<string>;
  pool: WritableSignal<string>;
  createdAt: WritableSignal<Date>;
  status: WritableSignal<string>;
  resultsLink: WritableSignal<string>;
}

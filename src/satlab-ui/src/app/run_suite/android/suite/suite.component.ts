import {CommonModule} from '@angular/common';
import {
  Component,
  EffectRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  Signal,
  SimpleChanges,
  ViewChild,
  computed,
  effect,
  signal,
  untracked,
  ChangeDetectionStrategy,
} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {ANDROID_TEST_PREFIX} from 'app/constants';
import {SelectableItem} from 'app/models/selectable_item';
import {AutocompleteSelectorComponent} from 'app/run_suite/common/autocomplete-selector/autocomplete-selector.component';
import {AndroidService} from 'app/services/android.service';
import {NotificationService} from 'app/services/notification.service';
import {toIterator} from 'app/utils/iterator';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {
  resetSignals,
  toSelectedItem,
  wrapperLoading,
} from 'app/utils/operators';

@Component({
  selector: 'app-suite',
  templateUrl: './suite.component.html',
  styleUrls: ['./suite.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    AutocompleteSelectorComponent,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
})
export class SuiteComponent implements OnChanges, OnDestroy {
  @ViewChild('testSelector') selector?: AutocompleteSelectorComponent;
  @ViewChild('suiteSelector') suiteSelector?: AutocompleteSelectorComponent;

  // branch is used to clear suite.
  @Input({required: true}) branch: string;
  @Input({required: true}) build: string;
  @Input({required: true}) target: string;
  @Input({required: true}) isTest: boolean;
  @Input() set pinnedSuite(val: string) {
    const next = val ?? '';
    if (next === this.pinnedSuiteSignal()) return;
    this.pinnedSuiteSignal.set(next);
    // Types sharing a build change no other input, so ngOnChanges won't run.
    queueMicrotask(() => {
      if (this.suiteOptions().length > 0) this.selectPinnedSuite();
    });
  }
  protected pinnedSuiteSignal = signal<string>('');

  protected testTitle = '';
  @Output() valuesChanged = new EventEmitter<{
    suite: string;
    testModules: string[];
  }>();
  @Output() onLoadingChanged = new EventEmitter<{
    show: boolean;
    message: string;
  }>();
  @Output() errorsChanged = new EventEmitter<string>();

  protected isLoading = signal<{show: boolean; message: string}>({
    show: false,
    message: '',
  });

  protected suiteOptions = signal<SelectableItem[]>([]);
  protected testOptions = signal<SelectableItem[]>([]);

  protected buildSignal = signal<string>('');
  protected targetSignal = signal<string>('');

  protected suiteSignal = signal<string>('');
  private suiteValid = computed(() => {
    const suite = this.suiteSignal();
    const suiteOptions = this.suiteOptions();
    return toIterator(suiteOptions).first_where(e => e.value === suite)
      ?.value as string;
  });
  protected testSignal = signal<string>('');
  protected testValid = computed(() => {
    const test = this.testSignal();
    return toIterator(this.testOptions()).first_where(e => e.value === test)
      ?.value as string;
  });

  protected selectedTestModulesSignal = signal<string[]>([]);

  protected testInputTabSignal = signal<'single' | 'multiple'>('single');
  protected multipleTestInputSignal = signal<string>('');

  private effectRefs: EffectRef[] = [];

  constructor(
    private androidService: AndroidService,
    private notification: NotificationService
  ) {
    this.effectRefs = [
      effect(() => {
        const build = this.buildSignal();
        const t2 = this.targetSignal();

        if (build && t2) {
          this.__listSuites(build, t2);
        }
      }),

      effect(() => {
        const build = untracked(() => this.buildSignal());
        const target = untracked(() => this.targetSignal());
        const suite = this.suiteValid();

        if (build && target && suite) {
          this.__listTests(build, target, suite as string);
        }
      }),
      effect(() => {
        if (this.suiteSignal() === '') {
          this.suiteSelector?.clear();
        }
      }),
      effect(() => {
        const loading = this.isLoading();
        queueMicrotask(() => {
          this.onLoadingChanged.emit(loading);
        });
      }),
    ];
  }

  ngOnDestroy(): void {
    this.errorsChanged.emit('');
    this.effectRefs.forEach(e => e.destroy());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('branch' in changes && changes['branch']) {
      resetSignals([
        this.suiteOptions,
        this.testOptions,
        this.selectedTestModulesSignal,
        this.suiteSignal,
        this.testSignal,
        this.targetSignal,
        this.buildSignal,
      ]);
    }
    if ('build' in changes && changes['build']) {
      resetSignals([
        this.suiteOptions,
        this.testOptions,
        this.selectedTestModulesSignal,
        this.suiteSignal,
        this.testSignal,
      ]);
      this.buildSignal.set(changes['build'].currentValue);
    }
    if ('target' in changes && changes['target']) {
      resetSignals([
        this.suiteOptions,
        this.testOptions,
        this.selectedTestModulesSignal,
        this.suiteSignal,
        this.testSignal,
      ]);
      this.targetSignal.set(changes['target'].currentValue);
    }
    if ('isTest' in changes && changes['isTest']) {
      resetSignals([
        this.selectedTestModulesSignal,
        this.suiteSignal,
        this.testSignal,
      ]);
      this.testTitle = this.isTest ? 'Test Include:' : 'Test Exclude:';
      // The reset above dropped the pinned suite, and nothing else re-applies
      // it while the build and target stay the same. Deferred, because
      // selecting emits valuesChanged, which the parent turns into a signal
      // write -- and ngOnChanges still runs inside its change detection pass.
      if (this.suiteOptions().length > 0) {
        queueMicrotask(() => this.selectPinnedSuite());
      }
    }
  }

  protected onSelectedChanged(key: 'suite' | 'test', value: string | null) {
    switch (key) {
      case 'suite':
        if (value === this.suiteSignal()) {
          break;
        }
        resetSignals([
          this.testOptions,
          this.selectedTestModulesSignal,
          this.testSignal,
        ]);
        this.suiteSignal.set(value ?? '');
        break;
      case 'test':
        this.testSignal.set(value ?? '');
        break;
    }
    this.emitCurrentData();
  }

  protected onSuiteInputChanged(value: string) {
    resetSignals([
      this.testOptions,
      this.selectedTestModulesSignal,
      this.testSignal,
    ]);

    const isValidSuite = this.suiteOptions().some(e => e.value === value);
    this.suiteSignal.set(isValidSuite ? value : '');
    this.emitCurrentData();
  }

  protected onInputTabChanged(tab: 'single' | 'multiple') {
    this.testInputTabSignal.set(tab);
    resetSignals([this.testSignal, this.multipleTestInputSignal]);
    this.selector?.clear();
  }

  protected onAddTestClicked() {
    const newValue = [
      ...this.selectedTestModulesSignal(),
      `${ANDROID_TEST_PREFIX}.${this.suiteSignal()}.${this.testSignal()}`,
    ];
    this.selectedTestModulesSignal.set(newValue);
    resetSignals([this.testSignal]);
    this.selector?.clear();
    this.emitCurrentData();
  }

  protected onRemoveTestClicked(index: number) {
    const newValue = [...this.selectedTestModulesSignal()];
    newValue.splice(index, 1);
    this.selectedTestModulesSignal.set(newValue);
    this.emitCurrentData();
  }

  protected onMultiLineTestInputChanged(event: Event) {
    const value = (event.target as HTMLTextAreaElement).value;
    this.multipleTestInputSignal.set(value);
  }

  protected onAddMultiTestsClicked() {
    const testsInput = this.multipleTestInputSignal();
    const tests = toIterator(testsInput.split(','))
      .map(e => e.trim())
      .filter(e => e !== '')
      .map(e => `${ANDROID_TEST_PREFIX}.${this.suiteSignal()}.${e}`)
      .collect();
    this.selectedTestModulesSignal.set([
      ...this.selectedTestModulesSignal(),
      ...tests,
    ]);
    resetSignals([this.multipleTestInputSignal]);
    this.emitCurrentData();
  }

  private __listSuites(build: string, target: string) {
    resetSignals([this.suiteOptions]);
    wrapperLoading(
      this.androidService.listSuites(build, target),
      this.isLoading,
      'Loading suites...'
    ).subscribe({
      next: e => {
        const uniqueSuites = toIterator(e)
          .unique_by()
          .collect()
          .sort((a, b) => a.localeCompare(b));
        this.suiteOptions.set(uniqueSuites.map(toSelectedItem));
        this.errorsChanged.emit(e.length === 0 ? 'No suites found.' : '');
        this.selectPinnedSuite();
      },
      error: e => {
        this.notification.error(`List suites failed: ${e}`, {dismiss: false});
      },
    });
  }

  private selectPinnedSuite() {
    const pinned = this.pinnedSuiteSignal();
    if (!pinned) return;
    if (!this.suiteOptions().some(o => o.value === pinned)) {
      this.errorsChanged.emit(
        `The pinned test build does not contain the ${pinned} suite.`
      );
      return;
    }
    this.onSelectedChanged('suite', pinned);
  }

  private __listTests(build: string, target: string, suite: string) {
    resetSignals([this.testOptions]);
    wrapperLoading(
      this.androidService.listTests(build, target, suite),
      this.isLoading,
      'Loading tests...'
    ).subscribe({
      next: e => {
        const uniqueTests = toIterator(e)
          .unique_by()
          .collect()
          .sort((a, b) => a.localeCompare(b));
        this.testOptions.set(uniqueTests.map(toSelectedItem));
        this.errorsChanged.emit(e.length === 0 ? 'No tests found.' : '');
      },
      error: e => {
        this.notification.error(`List tests failed: ${e}`, {dismiss: false});
      },
    });
  }

  private emitCurrentData() {
    const data = {
      suite: this.suiteSignal(),
      testModules: this.selectedTestModulesSignal(),
    };
    this.valuesChanged.emit(data);
  }
}

import {
  Component,
  EffectRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  WritableSignal,
  computed,
  effect,
  signal,
  untracked,
} from '@angular/core';
import {ANDROID_TEST_PREFIX} from 'app/constants';
import {SelectableItem} from 'app/models/selectable_item';
import {AutocompleteSelectorComponent} from 'app/run_suite/common/autocomplete-selector/autocomplete-selector.component';
import {AndroidService} from 'app/services/android.service';
import {NotificationService} from 'app/services/notification.service';
import {toIterator} from 'app/utils/iterator';
import {startWithTap} from 'app/utils/rxjs_operator';
import {Observable, finalize} from 'rxjs';

@Component({
  selector: 'app-suite',
  templateUrl: './suite.component.html',
  styleUrls: ['./suite.component.scss'],
})
export class SuiteComponent implements OnChanges, OnDestroy {
  @ViewChild('testSelector') selector?: AutocompleteSelectorComponent;
  @ViewChild('suiteSelector') suiteSelector?: AutocompleteSelectorComponent;

  @Input({required: true}) build;
  @Input({required: true}) target;
  @Input({required: true}) suite;
  @Input({required: true}) selectedTestModules;
  @Input({required: true}) testTitle;

  @Output() onSuiteChanged = new EventEmitter<string>();
  @Output() onTestModulesChanged = new EventEmitter<string[]>();
  @Output() onLoadingChanged = new EventEmitter<{
    show: boolean;
    message: string;
  }>();
  @Output() onSuiteValidChanged = new EventEmitter<boolean>();

  protected isLoading = signal<{show: boolean; message: string}>({
    show: false,
    message: '',
  });
  protected loadingMessage = signal<string>('');

  protected suiteOptions = signal<SelectableItem[]>([]);
  protected testOptions = signal<SelectableItem[]>([]);

  protected buildSignal = signal<string>('');
  protected targetSignal = signal<string[]>([]);

  private suiteTarget = computed(() => {
    return toIterator(this.targetSignal()).first_where(e =>
      e.includes('test_suites')
    );
  });
  protected suiteSignal = signal<string>('');
  private suiteValid = computed(() => {
    const suite = this.suiteSignal();
    return toIterator(this.suiteOptions()).first_where(e => e.value === suite)
      ?.value as string;
  });
  protected testSignal = signal<string>('');

  protected selectedTestModulesSignal = signal<string[]>([]);

  private effectRefs: EffectRef[] = [];

  constructor(
    private androidService: AndroidService,
    private notification: NotificationService
  ) {
    this.effectRefs = [
      effect(
        () => {
          resetSignals([
            this.suiteOptions,
            this.testOptions,
            this.selectedTestModulesSignal,
          ]);
          const build = this.buildSignal();
          const t2 = this.suiteTarget();

          if (build && t2) {
            this.__listSuites(build, t2);
          }
        },
        {
          allowSignalWrites: true,
        }
      ),

      effect(
        () => {
          resetSignals([
            this.testOptions,
            this.selectedTestModulesSignal,
            this.testSignal,
          ]);
          const build = untracked(() => this.buildSignal());
          const target = untracked(() => this.suiteTarget());
          let suite = this.suiteValid();

          if (build && target && suite !== undefined) {
            this.__listTests(build, target, suite);
          }
        },
        {
          allowSignalWrites: true,
        }
      ),
      effect(
        () => {
          this.onSuiteChanged.emit(this.suiteSignal());
        },
        {
          allowSignalWrites: true,
        }
      ),
      effect(
        () => {
          if (this.suiteSignal() === '') {
            this.suiteSelector?.clear();
          }
        },
        {allowSignalWrites: true}
      ),
      effect(
        () => {
          this.onTestModulesChanged.emit(this.selectedTestModulesSignal());
        },
        {
          allowSignalWrites: true,
        }
      ),
      effect(
        () => {
          this.onLoadingChanged.emit(this.isLoading());
        },
        {allowSignalWrites: true}
      ),

      effect(
        () => {
          this.onSuiteValidChanged.emit(this.suiteValid() !== undefined);
        },
        {allowSignalWrites: true}
      ),
    ];
  }

  ngOnDestroy(): void {
    this.effectRefs.forEach(e => e.destroy());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('build' in changes && changes['build']) {
      this.buildSignal.set(changes['build'].currentValue);
    }
    if ('target' in changes && changes['target']) {
      this.targetSignal.set(changes['target'].currentValue);
    }
    if ('suite' in changes && changes['suite']) {
      this.suiteSignal.set(changes['suite'].currentValue);
    }
    if ('test' in changes && changes['test']) {
      this.testSignal.set(changes['test'].currentValue);
    }
    if ('selectedTestModules' in changes && changes['selectedTestModules']) {
      this.selectedTestModulesSignal.set(
        changes['selectedTestModules'].currentValue
      );
    }
  }

  protected onSelectedChanged(key: 'suite' | 'test', value: string | null) {
    switch (key) {
      case 'suite':
        this.suiteSignal.set(value ?? '');
        break;
      case 'test':
        this.testSignal.set(value ?? '');
        break;
    }
  }

  protected onAddTestClicked() {
    const newValue = [
      ...this.selectedTestModulesSignal(),
      `${ANDROID_TEST_PREFIX}.${this.suiteSignal()}.${this.testSignal()}`,
    ];
    this.selectedTestModulesSignal.set(newValue);
    resetSignals([this.testSignal]);
    this.selector?.clear();
  }

  protected onRemoveTestClicked(index: number) {
    const newValue = [...this.selectedTestModulesSignal()];
    newValue.splice(index, 1);
    this.selectedTestModulesSignal.set(newValue);
  }

  private __listSuites(build: string, target: string) {
    resetSignals([this.suiteOptions]);
    wrapperLoading(
      this.androidService.listSuites(build, target),
      this.isLoading,
      'Loading suites...'
    ).subscribe({
      next: e => {
        this.suiteOptions.set(e.map(toSelectedItem));
      },
      error: e => {
        this.notification.error(`List suites failed: ${e}`, {dismiss: false});
      },
    });
  }

  private __listTests(build: string, target: string, suite: string) {
    resetSignals([this.testOptions]);
    wrapperLoading(
      this.androidService.listTests(build, target, suite),
      this.isLoading,
      'Loading tests...'
    ).subscribe({
      next: e => {
        this.testOptions.set(e.map(toSelectedItem));
      },
      error: e => {
        this.notification.error(`List tests failed: ${e}`, {dismiss: false});
      },
    });
  }
}

function wrapperLoading<T>(
  o: Observable<T>,
  loading: WritableSignal<{show: boolean; message: string}>,
  msg: string
) {
  return o.pipe(
    startWithTap(() => {
      loading.set({
        show: true,
        message: msg,
      });
    }),
    finalize(() => {
      loading.set({
        show: false,
        message: '',
      });
    })
  );
}

function resetSignals(
  signals: WritableSignal<unknown>[],
  defaultValue?: unknown
) {
  if (signals.length > 0) {
    if (defaultValue === undefined) {
      signals.forEach(e => {
        const value = untracked(() => {
          if (defaultValue) {
            return defaultValue;
          }

          if (typeof e() === 'string') {
            return '';
          } else if (Array.isArray(e())) {
            return [];
          } else if (typeof e() === 'object') {
            return {};
          }

          throw Error(`Unknown type of signal: ${typeof e()}`);
        });
        e.set(value);
      });
    }
  }
}

export function toSelectedItem(value: string): SelectableItem {
  return {
    label: '',
    value: value,
    text: value,
  };
}

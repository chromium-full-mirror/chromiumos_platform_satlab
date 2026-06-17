import {AndroidService} from '../../../services/android.service';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  EffectRef,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  Output,
  signal,
  untracked,
} from '@angular/core';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {CommonModule} from '@angular/common';
import {IDut} from '../../../models/dut';
import {SelectableItem} from '../../../models/selectable_item';
import {toSelectedItem, resetSignals} from '../../../../app/utils/operators';
import {startWithTap} from '../../../utils/rxjs_operator';
import {catchError, finalize, map, of, switchMap} from 'rxjs';

import {BasicSelectorComponent} from '../../common/basic-selector/basic-selector.component';
import {AutocompleteComponent} from '../../common/autocomplete/autocomplete.component';
import {NotificationService} from 'app/services/notification.service';
import {ERROR_KEY_MSG_CONFIGS} from 'app/models/error';

const TEST_PRODUCTS = [
  'aosp_x86_64',
  'aosp_arm64_plus_armv7',
  'aosp_arm64_desktop',
  'aosp_x86_64_desktop',
];

@Component({
  selector: 'app-android-build-picker',
  standalone: true,
  imports: [CommonModule, BasicSelectorComponent, AutocompleteComponent],
  templateUrl: './android-build-picker.component.html',
  styleUrls: ['./android-build-picker.component.scss'],
})
export class AndroidBuildPickerComponent implements OnDestroy {
  @Input() set board(val: string) {
    resetSignals([
      this.branchSignal,
      this.targetSignal,
      this.buildSignal,
      this.branchOptions,
      this.targetOptions,
      this.buildOptions,
      this.validBuild,
    ]);
    this.clearErrors();
    this.boardSignal.set(val);
  }

  @Input() set model(val: string) {
    const branch = untracked(() => this.branchSignal());
    // If model is present and branch doesn't include model, reset branch, target, build.
    if (val && !branch.includes(val)) {
      resetSignals([
        this.branchSignal,
        this.targetSignal,
        this.buildSignal,
        this.validBuild,
        this.targetOptions,
        this.buildOptions,
      ]);
      this.clearErrors();
    }
    this.modelSignal.set(val);
  }

  private typeSignal = signal<'provision' | 'test'>('test');
  @Input() set type(val: 'provision' | 'test') {
    this.typeSignal.set(val);
  }

  @Input() set duts(val: IDut[]) {
    this.dutsSignal.set(val);
  }

  @Input() set parentLoading(val: boolean) {
    this.isParentLoadingSignal.set(val);
  }

  // Loading with message event for parent component to display loading status.
  @Output() loadingWithMsg = new EventEmitter<{
    show: boolean;
    message: string;
  }>();

  // Data changed event for parent component to update its data.
  @Output() dataChanged = new EventEmitter<{
    type: 'provision' | 'test';
    branch: string;
    target: string;
    validBuild: string;
  }>();

  protected config = computed(() => ERROR_KEY_MSG_CONFIGS[this.typeSignal()]);

  public errMap = signal<Record<string, string>>({});

  protected dutsSignal = signal<IDut[]>([]);

  // Get all models for the same board.
  protected sameBoardModels = computed(() => {
    const board = this.boardSignal();
    return this.dutsSignal()
      .filter(e => e.board === board)
      .map(e => e.model);
  });

  protected boardSignal = signal<string>('');
  protected modelSignal = signal<string>('');

  protected branchOptions = signal<SelectableItem[]>([]);
  protected targetOptions = signal<SelectableItem[]>([]);
  protected buildOptions = signal<SelectableItem[]>([]);
  protected validBuild = signal<string>('');

  // Filter branch options based on model.
  // If model is present, include branches that include the model or exclude all other models with the same board.
  // If model is not present, include branches that include any model with the same board.
  protected filteredBranchOptions = computed(() => {
    const model = this.modelSignal();
    const notSelectedModels = this.sameBoardModels().filter(e => e !== model);
    const branchOptions = this.branchOptions();

    if (branchOptions.length === 0) return [];
    return branchOptions.filter(
      e =>
        e.text.includes(model) ||
        notSelectedModels.every(m => !e.text.includes(m))
    );
  });

  // Filter target options based on model and type.
  // If type is test, only show test_suites.
  // If model is present, show targets that include board or model and not test_suites (provision type).
  // If model is not present, show targets that include board or any connected model and not test_suites (provision type).
  protected filteredTargetOptions = computed(() => {
    const board = this.boardSignal();
    const model = this.modelSignal();
    const sameBoardModels = this.sameBoardModels();
    const type = this.typeSignal();
    const targetOptions = this.targetOptions();
    if (targetOptions.length === 0) return [];
    if (type === 'test') {
      return targetOptions.filter(e => e.text.includes('test_suites'));
    }
    if (model) {
      return targetOptions.filter(
        e =>
          (e.text.includes(board) || e.text.includes(model)) &&
          !e.text.includes('test_suites')
      );
    }
    return targetOptions.filter(
      e =>
        (e.text.includes(board) ||
          sameBoardModels.some(m => e.text.includes(m))) &&
        !e.text.includes('test_suites')
    );
  });

  protected branchSignal = signal<string>('');
  protected targetSignal = signal<string>('');
  protected buildSignal = signal<string>('');

  protected isBuildValidSignal = signal<boolean>(true);

  protected isParentLoadingSignal = signal<boolean>(false);
  protected loadingSignal = signal<{show: boolean; message: string}>({
    show: false,
    message: '',
  });

  // Disable autocomplete if branch or target is not selected, or if loading.
  protected autoCompleteDisabledMsg = computed(() => {
    const branch = this.branchSignal();
    const target = this.targetSignal();
    if (!branch || !target) {
      return 'Please select a branch and target first';
    }
    if (this.loadingSignal().show) {
      return this.loadingSignal().message;
    }
    return '';
  });

  private destroyRef = inject(DestroyRef);
  private refs: EffectRef[] = [];

  private notification = inject(NotificationService);

  constructor(private androidService: AndroidService) {
    toObservable(this.buildSignal)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(build => {
          if (!build) {
            const {keys} = untracked(() => this.config());
            this.updateErrMap([
              {key: keys.validate, value: ''},
              {key: keys.build, value: ''},
            ]);
            return of({isValid: false, build: ''});
          }
          return this.androidService
            .validateBuild(
              this.boardSignal(),
              this.branchSignal(),
              [this.targetSignal()],
              build
            )
            .pipe(
              map(isValid => ({isValid, build})),
              startWithTap(() => {
                const c = untracked(() => this.config());
                this.setLoadingAndEmit(true, `Validating ${c.label} build...`);
              }),
              finalize(() => {
                this.setLoadingAndEmit(false, '');
              }),
              catchError(err => {
                this.notification.error(
                  `Validate build failed: ${err.message}`
                );
                return of({isValid: false, build: ''});
              })
            );
        })
      )
      .subscribe(({isValid, build}) => {
        const {keys, msgs} = untracked(() => this.config());
        this.updateErrMap([{key: keys.build, value: ''}]);
        if (isValid) {
          this.validBuild.set(build);
          this.updateErrMap([{key: keys.validate, value: ''}]);
        } else {
          this.validBuild.set('');
          if (build) {
            this.updateErrMap([{key: keys.validate, value: msgs.validate}]);
          }
        }
      });

    this.refs = [
      effect(
        () => {
          const board = this.boardSignal();
          if (!board) return;

          const duts = untracked(() => this.dutsSignal());
          const sameBoardModels = duts
            .filter(e => e.board === board)
            .map(e => e.model);

          const req =
            this.typeSignal() === 'test'
              ? TEST_PRODUCTS
              : [...sameBoardModels, board];
          this.__listBranches(req);
        },
        {allowSignalWrites: true}
      ),

      // If branch changed, reset target, build, then call listTargets if branch is present.
      effect(
        () => {
          const branch = this.branchSignal();
          if (!branch) return;

          this.__listTargets(branch);
        },
        {allowSignalWrites: true}
      ),

      // If target changed, reset build, then call listBuilds if target is present.
      effect(
        () => {
          const target = this.targetSignal();
          const board = untracked(() => this.boardSignal());
          const branch = untracked(() => this.branchSignal());
          if (!target) return;

          this.__listBuilds(board, branch, [target]);
        },
        {allowSignalWrites: true}
      ),
      effect(
        () => {
          const type = untracked(() => this.typeSignal());
          const branch = this.branchSignal();
          const target = this.targetSignal();
          const validBuild = this.validBuild();
          this.dataChanged.emit({
            type: type,
            branch: branch,
            target: target,
            validBuild: validBuild,
          });
        },
        {allowSignalWrites: true}
      ),
    ];
  }

  private isDestroyed = false;

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.refs.forEach(ref => ref.destroy());
  }

  protected onPropsChanged(key: string, value: string) {
    const {keys} = untracked(() => this.config());
    switch (key) {
      case 'branch':
        this.updateErrMap([
          {key: keys.target, value: ''},
          {key: keys.build, value: ''},
          {key: keys.validate, value: ''},
        ]);
        resetSignals([
          this.targetSignal,
          this.buildSignal,
          this.targetOptions,
          this.buildOptions,
          this.validBuild,
        ]);
        this.branchSignal.set(value);
        break;
      case 'target':
        this.updateErrMap([
          {key: keys.build, value: ''},
          {key: keys.validate, value: ''},
        ]);
        resetSignals([this.buildSignal, this.buildOptions, this.validBuild]);
        this.targetSignal.set(value);
        break;
      case 'build':
        resetSignals([this.validBuild]);
        this.buildSignal.set(value);
        break;
    }
  }

  private clearErrors() {
    const {keys} = this.config();
    this.updateErrMap([
      {key: keys.branch, value: ''},
      {key: keys.target, value: ''},
      {key: keys.build, value: ''},
      {key: keys.validate, value: ''},
    ]);
  }

  private updateErrMap(errs: {key: string; value: string}[]) {
    this.errMap.update(current => {
      const next = {...current};
      errs.forEach(err => {
        next[err.key] = err.value;
      });
      return next;
    });
  }

  protected setLoadingAndEmit(show: boolean, message: string) {
    if (this.isDestroyed) return;
    this.loadingSignal.set({show, message});
    this.loadingWithMsg.emit({show, message});
  }

  protected onBuildInputValueChanged(value: string) {
    if (value === this.buildSignal()) return;
    resetSignals([this.validBuild]);
    this.buildSignal.set(value);
  }

  protected onBuildValidChanged(valid: boolean) {
    this.isBuildValidSignal.set(valid);
  }

  private __listBranches(targets: string[]) {
    console.log('Listing branches');
    this.androidService
      .listBranches(targets)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        startWithTap(() => {
          this.setLoadingAndEmit(
            true,
            `Listing ${this.config().label} branches...`
          );
        }),
        finalize(() => {
          this.setLoadingAndEmit(false, '');
        })
      )
      .subscribe(
        res => {
          const {keys, msgs} = untracked(() => this.config());
          this.updateErrMap([
            {key: keys.branch, value: res.length === 0 ? msgs.branch : ''},
          ]);
          this.branchOptions.set(res.map(e => toSelectedItem(e)));
        },
        error => {
          this.notification.error(`List branches failed: ${error.message}`, {
            dismiss: false,
          });
        }
      );
  }

  private __listTargets(branch: string) {
    console.log('Listing targets');
    this.androidService
      .listTargets(branch)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        startWithTap(() => {
          this.setLoadingAndEmit(
            true,
            `Listing ${this.config().label} targets...`
          );
        }),
        finalize(() => {
          this.setLoadingAndEmit(false, '');
        })
      )
      .subscribe(
        res => {
          const {keys, msgs} = untracked(() => this.config());
          this.updateErrMap([
            {key: keys.target, value: res.length === 0 ? msgs.target : ''},
          ]);
          this.targetOptions.set(res.map(e => toSelectedItem(e)));
        },
        error => {
          this.notification.error(`List targets failed: ${error.message}`, {
            dismiss: false,
          });
        }
      );
  }

  private __listBuilds(board: string, branch: string, targets: string[]) {
    console.log('Listing builds');
    this.androidService
      .listBuilds(board, branch, targets)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        startWithTap(() => {
          const c = untracked(() => this.config());
          this.setLoadingAndEmit(true, `Listing ${c.label} builds...`);
        }),
        finalize(() => {
          this.setLoadingAndEmit(false, '');
        })
      )
      .subscribe(
        res => {
          const {keys, msgs} = untracked(() => this.config());
          this.updateErrMap([
            {key: keys.build, value: res.length === 0 ? msgs.build : ''},
          ]);
          this.buildOptions.set(res.map(e => toSelectedItem(e)));
        },
        error => {
          this.notification.error(`List builds failed: ${error.message}`, {
            dismiss: false,
          });
        }
      );
  }
}

import {AndroidService} from '../../../../services/android.service';
import {
  Component,
  computed,
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
import {CommonModule} from '@angular/common';
import {IDut} from '../../../../models/dut';
import {SelectableItem} from '../../../../models/selectable_item';
import {
  toSelectedItem,
  resetSignals,
  wrapperLoading,
} from '../../../../../app/utils/operators';
import {AutocompleteComponent} from '../../../common/autocomplete/autocomplete.component';
import {NotificationService} from '../../../../services/notification.service';
import {toIterator} from '../../../../utils/iterator';
import {ALBuildBasic} from 'app/models/run_suite_fields';
import {
  invalidBuildMsg,
  noBranchMsg,
  noBuildMsg,
  noTargetMsg,
} from 'app/models/error';

const TEST_PRODUCTS = [
  'aosp_x86_64',
  'aosp_arm64_plus_armv7',
  'aosp_arm64_desktop',
  'aosp_x86_64_desktop',
];

@Component({
    selector: 'app-android-build-picker',
    imports: [AutocompleteComponent, CommonModule],
    templateUrl: './android-build-picker.component.html',
    styleUrls: ['./android-build-picker.component.scss']
})
export class AndroidBuildPickerComponent implements OnDestroy {
  // Input parameters.
  @Input() set board(val: string) {
    if (val === this.boardSignal()) {
      return;
    }
    resetSignals([
      this.branchSignal,
      this.targetSignal,
      this.buildSignal,
      this.branchOptions,
      this.filteredBranchOptions,
      this.targetOptions,
      this.buildOptions,
      this.validBuild,
    ]);
    this.resetValuesAndErrors();
    this.boardSignal.set(val);
  }

  @Input() set model(val: string) {
    if (val === this.modelSignal()) {
      return;
    }
    const branch = untracked(() => this.branchSignal());
    // If model is present and branch doesn't include model, reset branch, target, build.
    // If branch is already empty, no need to reset again.
    if (val && branch !== '' && !branch.includes(val)) {
      resetSignals([
        this.branchSignal,
        this.targetSignal,
        this.buildSignal,
        this.targetOptions,
        this.buildOptions,
        this.validBuild,
      ]);
      this.resetValuesAndErrors();
    }
    const filtered = this.updateBranchOptions(
      val,
      this.sameBoardModels(),
      this.branchOptions()
    );
    this.filteredBranchOptions.set([...filtered]);
    this.modelSignal.set(val);
  }

  private _type: 'provision' | 'test' = 'test';
  @Input() set type(val: 'provision' | 'test') {
    this._type = val;
    this.label = val === 'provision' ? 'OS' : 'Test';
  }

  @Input() set duts(val: IDut[]) {
    this.dutsSignal.set(val);
  }

  @Input() set parentLoading(val: boolean) {
    this.isParentLoadingSignal.set(val);
  }

  // It is used for parent component to control whether this component is active.
  @Input() set active(val: boolean) {
    this.activeSignal.set(val);
  }

  // Output variables.
  @Output() isLoadingChanged = new EventEmitter<{
    show: boolean;
    message: string;
  }>();

  @Output() valuesChanged = new EventEmitter<ALBuildBasic>();
  @Output() errorsChanged = new EventEmitter<string>();

  protected label = 'OS';
  protected errSignal = signal<string>('');
  protected boardSignal = signal<string>('');
  protected modelSignal = signal<string>('');
  protected dutsSignal = signal<IDut[]>([]);
  protected activeSignal = signal<boolean>(true);
  protected validBuild = signal<string>('');
  // Signals for holding values, which are going to emit to parent component.
  protected branchSignal = signal<string>('');
  protected targetSignal = signal<string>('');
  protected buildSignal = signal<string>('');
  // Signals for options.
  protected branchOptions = signal<SelectableItem[]>([]);
  protected filteredBranchOptions = signal<SelectableItem[]>([]);
  protected targetOptions = signal<SelectableItem[]>([]);
  protected buildOptions = signal<SelectableItem[]>([]);

  // Signals for loading states.
  protected isParentLoadingSignal = signal<boolean>(false);
  protected loadingSignal = signal<{show: boolean; message: string}>({
    show: false,
    message: '',
  });

  // Get all models for the same board.
  protected sameBoardModels = computed(() => {
    const board = this.boardSignal();
    const duts = this.dutsSignal();
    return toIterator(duts)
      .filter(e => e.board === board)
      .map(e => e.model)
      .collect();
  });

  private refs: EffectRef[] = [];

  private notification = inject(NotificationService);

  constructor(private androidService: AndroidService) {
    this.refs = [
      effect(
        () => {
          // If board is not present, component is not active or branch options are already present, do nothing.
          const board = this.boardSignal();
          const active = this.activeSignal();
          const hasBranch = untracked(
            () => this.filteredBranchOptions().length > 0
          );
          if (!board || !active || (active && hasBranch)) return;

          const model = untracked(() => this.modelSignal());
          const sameBoardModels = untracked(() => this.sameBoardModels());

          const req =
            this._type === 'test' ? TEST_PRODUCTS : [...sameBoardModels, board];
          this.__listBranchesAndUpdate(req, {model, sameBoardModels});
        },
        {allowSignalWrites: true}
      ),

      // If branch changed, reset target, build, then call listTargets if branch is present.
      effect(
        () => {
          const branch = this.branchSignal();

          if (!branch) return;
          const board = untracked(() => this.boardSignal());
          const model = untracked(() => this.modelSignal());
          const sameBoardModels = untracked(() => this.sameBoardModels());

          this.__listTargets(branch, {board, model, sameBoardModels});
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
      effect(() => {
        const loading = this.loadingSignal();
        queueMicrotask(() => {
          this.isLoadingChanged.emit(loading);
        });
      }),
    ];
  }

  ngOnDestroy(): void {
    this.refs.forEach(ref => ref.destroy());
  }

  // resetValuesAndErrors reset all emit values and errors.
  // It is used when board/model is changed.
  private resetValuesAndErrors() {
    if (this.activeSignal()) {
      queueMicrotask(() => {
        this.valuesChanged.emit({
          branch: '',
          target: '',
          build: '',
        });
        this.errSignal.set('');
      });
    }
  }

  protected onPropsChanged(key: string, value: string) {
    switch (key) {
      case 'branch':
        this.errSignal.set('');
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
        this.errSignal.set('');
        resetSignals([this.buildSignal, this.buildOptions, this.validBuild]);
        this.targetSignal.set(value);
        break;
      case 'build':
        this.errSignal.set('');
        this.buildSignal.set(value);
        this.validBuild.set(value);
        break;
    }
    this.valuesChanged.emit({
      branch: this.branchSignal() || '',
      target: this.targetSignal() || '',
      build: this.validBuild() || '',
    });
    this.errorsChanged.emit(this.errSignal());
  }

  protected onBuildInputValueChanged(value: string) {
    this.errSignal.set('');
    resetSignals([this.validBuild]);
    this.buildSignal.set(value);
    if (value !== '') {
      this.validateBuild(
        this.boardSignal(),
        this.branchSignal(),
        [this.targetSignal()],
        value
      );
    } else {
      this.valuesChanged.emit({
        branch: this.branchSignal(),
        target: this.targetSignal(),
        build: '',
      });
    }
  }

  protected onBranchInputValueChanged(value: string) {
    this.errSignal.set('');
    resetSignals([
      this.targetOptions,
      this.targetSignal,
      this.buildSignal,
      this.buildOptions,
      this.validBuild,
    ]);
    this.branchSignal.set(value);
    this.valuesChanged.emit({
      branch: value,
      target: '',
      build: '',
    });
  }

  protected onTargetInputValueChanged(value: string) {
    this.errSignal.set('');
    resetSignals([this.buildOptions, this.buildSignal, this.validBuild]);
    this.targetSignal.set(value);
    this.valuesChanged.emit({
      branch: this.branchSignal(),
      target: value,
      build: '',
    });
  }

  protected updateErrAndEmit(value: string) {
    this.errSignal.set(value);
    this.errorsChanged.emit(value);
  }

  private __listBranchesAndUpdate(
    targets: string[],
    updateFilter: {model: string; sameBoardModels: string[]}
  ) {
    console.log('Listing branches');
    wrapperLoading(
      this.androidService.listBranches(targets),
      this.loadingSignal,
      `Listing ${this.label} branches...`
    ).subscribe(
      res => {
        const opts = this.updateBranchOptions(
          updateFilter.model,
          updateFilter.sameBoardModels,
          res.map(e => toSelectedItem(e))
        );
        this.updateErrAndEmit(opts.length === 0 ? noBranchMsg : '');
        this.branchOptions.set(res.map(toSelectedItem));
        this.filteredBranchOptions.set(opts);
      },
      error => {
        this.notification.error(`List branches failed: ${error.message}`, {
          dismiss: false,
        });
      }
    );
  }

  private __listTargets(
    branch: string,
    updateFilter: {board: string; model: string; sameBoardModels: string[]}
  ) {
    console.log('Listing targets');
    wrapperLoading(
      this.androidService.listTargets(branch),
      this.loadingSignal,
      `Listing ${this.label} targets...`
    ).subscribe(
      res => {
        const opts = this.updateTargetOptions(
          updateFilter.board,
          updateFilter.model,
          updateFilter.sameBoardModels,
          res.map(e => toSelectedItem(e))
        );
        this.updateErrAndEmit(opts.length === 0 ? noTargetMsg : '');
        this.targetOptions.set(opts);
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
    wrapperLoading(
      this.androidService.listBuilds(board, branch, targets),
      this.loadingSignal,
      `Listing ${this.label} builds...`
    ).subscribe(
      res => {
        this.updateErrAndEmit(res.length === 0 ? noBuildMsg : '');
        this.buildOptions.set(res.map(e => toSelectedItem(e)));
      },
      error => {
        this.notification.error(`List builds failed: ${error.message}`, {
          dismiss: false,
        });
      }
    );
  }

  private validateBuild(
    board: string,
    branch: string,
    targets: string[],
    build: string
  ) {
    console.log(`Validating build: ${build}`);
    wrapperLoading(
      this.androidService.validateBuild(board, branch, targets, build),
      this.loadingSignal,
      `Validating ${this.label} build...`
    ).subscribe(
      res => {
        if (res) {
          this.validBuild.set(build);
          this.valuesChanged.emit({
            branch: this.branchSignal(),
            target: this.targetSignal(),
            build: build,
          });
          this.updateErrAndEmit('');
        } else {
          this.validBuild.set('');
          this.valuesChanged.emit({
            branch: this.branchSignal(),
            target: this.targetSignal(),
            build: '',
          });
          this.updateErrAndEmit(invalidBuildMsg);
        }
      },
      error => {
        this.notification.error(`Validate build failed: ${error.message}`, {
          dismiss: false,
        });
      }
    );
  }

  // Filter branch options based on model.
  // If model is present, include branches that include the model or exclude all other models with the same board.
  // If model is not present, include branches that include any model with the same board.
  private updateBranchOptions(
    model: string,
    sameBoardModels: string[],
    branchOptions: SelectableItem[]
  ) {
    if (!model) return branchOptions;
    const notSelectedModels = sameBoardModels.filter(e => e !== model);

    return branchOptions.filter(e =>
      notSelectedModels.every(m => !e.text.includes(m))
    );
  }

  // Filter target options based on model and type.
  // If type is test, only show test_suites.
  // If model is present, show targets that include board or model and not test_suites (provision type).
  // If model is not present, show targets that include board or any connected model and not test_suites (provision type).
  private updateTargetOptions(
    board: string,
    model: string,
    sameBoardModels: string[],
    targetOptions: SelectableItem[]
  ) {
    if (this._type === 'test') {
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
  }

  protected isFormLoading = computed(() => {
    return this.loadingSignal().show || this.isParentLoadingSignal();
  });
}

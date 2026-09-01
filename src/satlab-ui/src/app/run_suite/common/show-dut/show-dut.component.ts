import {
  OnInit,
  Component,
  computed,
  EventEmitter,
  Input,
  Output,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IDut} from '../../../models/dut';
import {toIterator} from '../../../utils/iterator';
import {
  resetSignals,
  setSignalAndEmit,
  toSelectedItem,
  wrapperLoading,
} from '../../../utils/operators';
import {BasicSelectorComponent} from '../basic-selector/basic-selector.component';
import {LoadingComponent} from '../loading/loading.component';
import {toObservable} from '@angular/core/rxjs-interop';
import {from} from 'rxjs';
import {SatlabRpcService} from 'app/services/satlab-rpc.service';
import {NotificationService} from 'app/services/notification.service';
import {SelectableItem} from 'app/models/selectable_item';
import {noDutsMsg} from 'app/models/error';

export type SelectorType = 'pool' | 'hostname' | 'board' | 'model';

@Component({
    selector: 'app-show-dut',
    imports: [BasicSelectorComponent, CommonModule, LoadingComponent],
    templateUrl: './show-dut.component.html',
    styleUrls: ['./show-dut.component.scss']
})
export class ShowDutComponent implements OnInit {
  @Input() set model(value: string) {
    this.modelSignal.set(value);
  }

  @Input({required: true}) set selectorList(value: SelectorType[]) {
    this.selectorListSignal.set(value);
  }

  @Input() set isParentLoading(val: boolean) {
    this.isParentLoadingSignal.set(val);
  }

  // Output values.
  @Output() valuesChanged: EventEmitter<{
    board: string;
    model: string;
    pool: string;
    hostname?: string;
  }> = new EventEmitter();

  @Output() dutsChanged = new EventEmitter<IDut[]>();

  // Basic signals for saving values.
  protected dutsSignal = signal<IDut[]>([]);
  protected boardSignal = signal<string>('');
  protected modelSignal = signal<string>('');
  protected poolSignal = signal<string>('');
  protected hostnameSignal = signal<string>('');
  protected selectorListSignal = signal<SelectorType[]>([]);

  // Loading state.
  protected isLoadingSignal = signal<{show: boolean; message: string}>({
    show: false,
    message: '',
  });
  protected loading$ = toObservable(this.isLoadingSignal);
  protected isParentLoadingSignal = signal<boolean>(false);
  protected disabledSignal = computed(() => {
    return this.isLoadingSignal().show || this.isParentLoadingSignal();
  });

  // Error message.
  protected errSignal = signal<string>('');

  // Computed options map for all dynamic selectors.
  protected selectorOptionsMap = computed(() => {
    const list = this.selectorListSignal();
    const duts = this.dutsSignal();
    const currentValues = this.selectedValuesMap();

    // optionMap stores the selectable options for each selector.
    const optionsMap = {} as Record<SelectorType, SelectableItem[]>;

    list.forEach((selector, index) => {
      optionsMap[selector] = this.getSelectorOptions(
        selector,
        index,
        duts,
        list,
        currentValues
      );
    });

    return optionsMap;
  });

  constructor(
    private service: SatlabRpcService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.__listDuts();
  }

  private __listDuts() {
    wrapperLoading(
      from(this.service.listEnrolledDUTs()),
      this.isLoadingSignal,
      'Listing DUTs...'
    ).subscribe({
      next: e => {
        this.errSignal.set(e.length === 0 ? noDutsMsg : '');
        setSignalAndEmit(this.dutsSignal, e, this.dutsChanged);
      },
      error: e => {
        this.notification.error(`List DUTs failed: ${e}`, {dismiss: false});
      },
    });
  }

  protected selectedValuesMap = computed(() => {
    const pool = this.poolSignal();
    const board = this.boardSignal();
    const model = this.modelSignal();
    const hostname = this.hostnameSignal();
    return {
      pool: pool,
      board: board,
      model: model,
      hostname: hostname,
    };
  });

  protected readonly selectorTitles: Record<SelectorType, string> = {
    pool: 'Select Pool:',
    board: 'Select Board:',
    model: 'Select Model (Optional):',
    hostname: 'Select Hostname:',
  };

  // Reset all selectors that appear after this selector in the list and are incompatible with the new value.
  private resetIncompatibleSelectors(selector: SelectorType, newVal: string) {
    const list = this.selectorListSignal();
    const index = list.indexOf(selector);
    if (index === -1) return;

    const duts = this.dutsSignal();
    const tempValues: Record<SelectorType, string> = {
      ...this.selectedValuesMap(),
    };
    tempValues[selector] = newVal;

    const resetList: WritableSignal<string>[] = [];
    for (let j = index + 1; j < list.length; j++) {
      const succSelector = list[j];
      const succVal = tempValues[succSelector];

      if (succVal) {
        const nextOptions = this.getSelectorOptions(
          succSelector,
          j,
          duts,
          list,
          tempValues
        );
        const isCompatible = nextOptions.some(opt => opt.value === succVal);
        if (!isCompatible) {
          if (succSelector === 'pool') resetList.push(this.poolSignal);
          if (succSelector === 'board') resetList.push(this.boardSignal);
          if (succSelector === 'model') resetList.push(this.modelSignal);
          if (succSelector === 'hostname') resetList.push(this.hostnameSignal);
          tempValues[succSelector] = '';
        }
      }
    }
    resetSignals(resetList);
  }

  protected onSelectorChanged(selector: SelectorType, val: string) {
    this.resetIncompatibleSelectors(selector, val);

    const duts = toIterator(this.dutsSignal());
    switch (selector) {
      case 'pool':
        this.poolSignal.set(val);
        break;
      case 'board':
        this.boardSignal.set(val);
        break;
      case 'model':
        // Every model has one board, set it directly.
        this.modelSignal.set(val);
        const d = duts.first_where(d => d.model === val);
        if (d) {
          this.boardSignal.set(d.board);
        }
        break;
      case 'hostname':
        this.hostnameSignal.set(val);
        // hostname is unique, we can set board, model, and pool directly.
        const dut = duts.first_where(d => d.hostname === val);
        if (dut) {
          this.boardSignal.set(dut.board);
          this.modelSignal.set(dut.model);
          if (dut.pools.length > 0 && this.poolSignal() === '') {
            this.poolSignal.set(dut.pools[0]);
          }
        }
        break;
    }
    this.valuesChanged.emit(this.selectedValuesMap());
  }

  // Filter DUTs based on previously selected values.
  private getSelectorOptions(
    selector: SelectorType,
    index: number,
    duts: IDut[],
    list: SelectorType[],
    currentValues: Record<SelectorType, string>
  ): SelectableItem[] {
    let filteredDuts = duts;

    // If index === 0, then all DUTs are candidates, so no need to filter.
    // Otherwise, filter DUTs based on previously selected values.
    if (index > 0) {
      for (let j = 0; j < index; j++) {
        const prevSelector = list[j];
        const prevValue = currentValues[prevSelector];
        if (prevValue) {
          filteredDuts =
            prevSelector === 'pool'
              ? filteredDuts.filter(d => d.pools.includes(prevValue))
              : filteredDuts.filter(
                  d => d[prevSelector as keyof IDut] === prevValue
                );
        }
      }
    }

    const values =
      selector === 'pool'
        ? filteredDuts.flatMap(d => d.pools)
        : filteredDuts.map(d => d[selector as keyof IDut] as string);

    return Array.from(new Set(values)).map(e => toSelectedItem(e));
  }
}

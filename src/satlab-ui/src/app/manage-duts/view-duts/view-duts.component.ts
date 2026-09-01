import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {IDut} from '../../models/dut';
import {SelectionModel} from '@angular/cdk/collections';
import {MatCheckboxChange} from '@angular/material/checkbox';
import {toIterator} from '../../utils/iterator';
import {MatDialog} from '@angular/material/dialog';
import {StageBuildComponent} from '../../dialogs/stage-build/stage-build.component';
import {OpenCcdComponent} from 'app/dialogs/open-ccd/open-ccd.component';
import {delay} from 'rxjs';
import {trigger, state, transition, style, animate} from '@angular/animations';
import {BUILD_ACCESS_REQUEST_URL} from 'app/constants';
import {MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {SatlabRpcService} from '../../services/satlab-rpc.service';

@Component({
  selector: 'app-view-duts',
  templateUrl: './view-duts.component.html',
  styleUrls: ['./view-duts.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '50px'})),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class ViewDutsComponent implements OnChanges, OnInit {
  @Input() DUTs: IDut[] = [];
  @Input() loading = false;
  @Input() hostnamePrefix = '';
  @Output() selectDUTs = new EventEmitter<IDut[]>();
  readonly build_access_request_link = BUILD_ACCESS_REQUEST_URL;

  protected allSelected = false;
  protected selection = new SelectionModel<IDut>(true, []);
  protected selectionCount = 0;

  protected duts: IDut[] = [];

  protected disabledServo: string[] = [];
  protected boardsList: string[] = [];
  protected modelsCache: Map<string, string[]> = new Map();
  protected loadingBoards = false;
  protected loadingModels: Set<string> = new Set();
  protected boardsLoaded = false;

  protected displayedColumns = [
    'check',
    'expand',
    'ip',
    'hostname',
    'board',
    'model',
    'servo_serial',
    'testlab',
    'ccd_status',
    'status',
    'pools',
    'mac',
  ];

  protected expandInfo: IDut | null = null;

  constructor(
    protected dialog: MatDialog,
    private service: SatlabRpcService
  ) {}

  ngOnInit() {
    this.loadBoards();
  }

  protected trackByAddress(index: number, item: IDut): string {
    return item.address;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['DUTs'] &&
      changes['DUTs'].previousValue !== changes['DUTs'].currentValue
    ) {
      if (changes['DUTs'].previousValue) {
        this.duts = merge(this.duts, changes['DUTs'].currentValue);
      } else {
        this.duts = [...changes['DUTs'].currentValue];
      }

      this.initInputFields();
      this.validateAllDutsPermissions();

      if (this.selection && this.selection.selected.length > 0) {
        const s = find(this.selection, this.duts);
        this.selection.clear();
        s.forEach(e => this.#toggleDUT(e));
      }
    }
  }

  protected initInputFields() {
    if (!this.duts) return;
    for (const dut of this.duts) {
      if (dut.hostname === '' && dut.isConnected) {
        if (dut.inputBoard === undefined) {
          dut.inputBoard = dut.board || '';
        }
        if (dut.inputModel === undefined) {
          dut.inputModel = dut.model || '';
        }
      }
    }
  }

  protected async validateAllDutsPermissions() {
    await this.loadBoards();
    for (const dut of [...this.duts]) {
      if (dut.hostname === '' && dut.isConnected) {
        await this.validatePermission(dut);
      }
    }
  }

  /**
   * listen an event that a single DUT checkbox has been changed
   * @param e which DUT has been changed
   * @protected
   */
  protected onDUTCheckboxChanged(e: IDut) {
    this.#toggleDUT(e);
  }

  /**
   * select a DUT.
   * @param d the DUT that we want to select.
   * @private
   */
  #toggleDUT(d: IDut) {
    this.selection.toggle(d);
    this.__selectionChanged();
  }

  protected canSelectDUT(element: IDut): boolean {
    if (!element.isAccessible || element.hasPermission !== true) {
      return false;
    }
    if (element.hostname === '') {
      const hostname = (element.inputHostname !== undefined ? element.inputHostname : element.hostname).trim();
      if (!hostname || !this.__validateHostname(hostname)) {
        return false;
      }
      if (this.isInvalidBoard(element) || this.isInvalidModel(element)) {
        return false;
      }
    }
    return true;
  }

  protected hasSelectableDUTs(): boolean {
    return (this.duts || []).some(e => this.canSelectDUT(e));
  }

  /**
   * listen an event that all DUTs checkboxes have been changed
   * @param e this checkbox value, if checked is true, means all
   * DUTs are selected. Otherwise, all DUTs are un-selected.
   * @protected
   */
  protected onCheckboxChanged(e: MatCheckboxChange) {
    this.selection.clear();
    if (e.checked) {
      toIterator(this.duts)
        .filter(e => this.canSelectDUT(e))
        .forEach(e => {
          this.selection.toggle(e);
        });
    }
    this.__selectionChanged();
  }

  /**
   * checkSelectionContains check the DUT is in the selection.
   * @param dut this information of DUT
   * @private
   */
  private checkSelectionContains(dut: IDut) {
    for (const d of this.selection.selected) {
      if (d.address === dut.address) {
        return true;
      }
    }
    return false;
  }

  protected onHostnameInput(dut: IDut, e: Event) {
    const v = (e.target as HTMLInputElement).value.trim();
    dut.inputHostname = v;
    if (!this.canSelectDUT(dut) && this.checkSelectionContains(dut)) {
      this.selection.deselect(dut);
      this.__emitSelectionChanged();
    }
  }

  /**
   * onInputChange this is event that a user change the input
   * value and lost focus.
   * @param dut the information of DUT
   * @param e the input event
   * @protected
   */
  protected onInputFocusout(dut: IDut, e: Event) {
    const v = (e.target as HTMLInputElement).value.trim();
    if (!this.__validateHostname(v)) {
      return;
    }

    if (dut.inputHostname === v) {
      return;
    }
    const fire = this.checkSelectionContains(dut);
    // make a new DUT
    const newDut = {
      ...dut,
      inputHostname: v.trim(),
    };
    // find the dut in the DUTs list
    const idx = this.duts.indexOf(dut);
    // replace it to a new DUT
    this.duts = [
      ...this.duts.slice(0, idx),
      newDut,
      ...this.duts.slice(idx + 1),
    ];

    if (fire) {
      // find the dut in the selection
      const idx = this.selection.selected.indexOf(dut);
      this.selection.setSelection(
        ...[
          ...this.selection.selected.slice(0, idx),
          newDut,
          ...this.selection.selected.slice(idx + 1),
        ]
      );
      this.__emitSelectionChanged();
    }
  }

  private __validateHostname(s: string) {
    return /^[a-z0-9-]{1,32}$/.test(s);
  }

  /**
   * a handler handles a user clicks on the `AccessTestBuild` Button
   * @protected
   */
  protected onAccessTestBuildClicked() {
    this.dialog.open(StageBuildComponent);
  }

  /**
   * a function handles any checkbox changed.
   * @private
   */
  private __selectionChanged() {
    // update how many DUTs have been selected
    this.__updateSelectionCount();

    // emit selection changed
    this.__emitSelectionChanged();
  }

  /**
   * update how many DUTs that a user has been selected
   * if all items have been selected, update the `allSelected` flag to true.
   * Otherwise, update it to false.
   * @private
   */
  private __updateSelectionCount() {
    this.selectionCount = this.selection.selected.length;

    const selectableCount = toIterator(this.duts)
      .filter(e => this.canSelectDUT(e))
      .collect().length;

    this.allSelected =
      selectableCount > 0 && this.selectionCount === selectableCount;
  }

  /**
   * Emit the event when a user changed any checkbox.
   * @private
   */
  private __emitSelectionChanged() {
    this.selectDUTs.emit(this.selection.selected);
  }

  protected isLoadingBoard(dut: IDut): boolean {
    return this.loadingBoards || !this.boardsLoaded;
  }

  protected isLoadingModel(dut: IDut): boolean {
    const b = (dut.inputBoard !== undefined ? dut.inputBoard : dut.board).trim();
    if (!b) return this.isLoadingBoard(dut);
    return this.isLoadingBoard(dut) || (this.loadingModels.has(b) && !this.modelsCache.has(b));
  }

  protected isInvalidBoard(dut: IDut): boolean {
    if (this.isLoadingBoard(dut)) return false;
    const b = (dut.inputBoard !== undefined ? dut.inputBoard : dut.board).trim();
    if (!b) return true;
    return this.boardsList.length > 0 && !this.boardsList.includes(b);
  }

  protected isInvalidModel(dut: IDut): boolean {
    if (this.isLoadingModel(dut)) return false;
    const b = (dut.inputBoard !== undefined ? dut.inputBoard : dut.board).trim();
    const m = (dut.inputModel !== undefined ? dut.inputModel : dut.model).trim();
    if (!b || !m) return true;
    const models = this.modelsCache.get(b);
    if (!models) return false;
    return !models.includes(m);
  }

  protected onBoardInput(dut: IDut, e: Event) {
    const v = (e.target as HTMLInputElement).value.trim();
    dut.inputBoard = v;
    if (v) {
      this.loadModelsForBoard(v);
    }
    this.validatePermission(dut);
  }

  protected onModelInput(dut: IDut, e: Event) {
    const v = (e.target as HTMLInputElement).value.trim();
    dut.inputModel = v;
    this.validatePermission(dut);
  }

  protected onBoardInputFocusout(dut: IDut, e: Event) {
    const v = (e.target as HTMLInputElement).value.trim();
    if (dut.inputBoard === v) {
      return;
    }
    this.onBoardInput(dut, e);
  }

  protected onModelInputFocusout(dut: IDut, e: Event) {
    const v = (e.target as HTMLInputElement).value.trim();
    if (dut.inputModel === v) {
      return;
    }
    this.onModelInput(dut, e);
  }

  protected async validatePermission(dut: IDut) {
    const board = (dut.inputBoard !== undefined ? dut.inputBoard : dut.board).trim();
    const model = (dut.inputModel !== undefined ? dut.inputModel : dut.model).trim();

    if (!board || !model) {
      if (dut.hasPermission !== false) {
        dut.hasPermission = false;
        if (this.checkSelectionContains(dut)) {
          this.selection.deselect(dut);
          this.__emitSelectionChanged();
        }
      }
      return;
    }

    try {
      await this.loadBoards();
      const models = await this.loadModelsForBoard(board);

      if (this.isLoadingBoard(dut) || this.isLoadingModel(dut)) {
        return;
      }

      const currentBoard = (dut.inputBoard !== undefined ? dut.inputBoard : dut.board).trim();
      const currentModel = (dut.inputModel !== undefined ? dut.inputModel : dut.model).trim();
      if (currentBoard !== board || currentModel !== model) {
        return;
      }

      const isBoardValid = this.boardsList.length === 0 || this.boardsList.includes(board);
      const isModelValid = models.includes(model);

      const hasPerm = isBoardValid && isModelValid;

      if (dut.hasPermission !== hasPerm) {
        dut.hasPermission = hasPerm;

        if (this.checkSelectionContains(dut)) {
          if (!hasPerm) {
            this.selection.deselect(dut);
          }
          this.__emitSelectionChanged();
        }
      }
    } catch (err) {
      console.error('Failed to validate permission for board/model:', err);
    }
  }

  protected async loadBoards() {
    if (!this.boardsLoaded && !this.loadingBoards) {
      this.loadingBoards = true;
      try {
        this.boardsList = await this.service.listBoards();
        this.boardsLoaded = true;
      } catch (err) {
        console.error('Failed to load build targets:', err);
      } finally {
        this.loadingBoards = false;
      }
    }
  }

  protected async loadModelsForBoard(board: string): Promise<string[]> {
    if (!board) {
      return [];
    }
    if (this.modelsCache.has(board)) {
      return this.modelsCache.get(board)!;
    }
    if (this.loadingModels.has(board)) {
      return [];
    }
    this.loadingModels.add(board);
    try {
      const models = await this.service.listModels(board);
      const res = models || [];
      this.modelsCache.set(board, res);
      this.revalidateDutsForBoard(board);
      return res;
    } catch (err) {
      console.error(`Failed to load models for board ${board}:`, err);
      this.modelsCache.set(board, []);
      this.revalidateDutsForBoard(board);
      return [];
    } finally {
      this.loadingModels.delete(board);
    }
  }

  protected revalidateDutsForBoard(board: string) {
    if (!this.duts) return;
    for (const dut of this.duts) {
      const b = (dut.inputBoard !== undefined ? dut.inputBoard : dut.board).trim();
      if (b === board) {
        this.validatePermission(dut);
      }
    }
  }

  protected getFilteredBoards(dut: IDut): string[] {
    const query = (dut.inputBoard ?? '').toLowerCase().trim();
    if (!query) {
      return this.boardsList;
    }
    return this.boardsList.filter(b => b.toLowerCase().includes(query));
  }

  protected getFilteredModels(dut: IDut): string[] {
    const board = (dut.inputBoard !== undefined ? dut.inputBoard : dut.board).trim();
    if (!board) {
      return [];
    }
    const models = this.modelsCache.get(board) || [];
    const query = (dut.inputModel ?? '').toLowerCase().trim();
    if (!query) {
      return models;
    }
    return models.filter(m => m.toLowerCase().includes(query));
  }

  protected onBoardOptionSelected(dut: IDut, event: MatAutocompleteSelectedEvent) {
    const v = event.option.value;
    dut.inputBoard = v;
    this.loadModelsForBoard(v);
    this.validatePermission(dut);
  }

  protected onModelOptionSelected(dut: IDut, event: MatAutocompleteSelectedEvent) {
    const v = event.option.value;
    dut.inputModel = v;
    this.validatePermission(dut);
  }

  /**
   * Open CCD and testlab of DUT
   * @param servoSerial
   */
  protected onOpenCCDClicked(servoSerial: string) {
    this.disabledServo = [...this.disabledServo, servoSerial];
    const dialogRef = this.dialog.open(OpenCcdComponent, {
      data: {servoSerial: servoSerial},
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .pipe(delay(5000))
      .subscribe(() => {
        this.disabledServo = this.disabledServo.filter(
          ele => ele !== servoSerial
        );
      });
  }

  toggleExpand(dut: IDut) {
    this.expandInfo = this.expandInfo === dut ? null : dut;
  }
}

/**
 * merge new DUTs.
 * if DUT has been enrolled, we use new one.
 * if DUT doesn't have test image, we use new one.
 * if DUT isn't enrolled. we merge the old state (e.g. the hostname that a user has input) to new one.
 * @param from the list of old DUTs
 * @param to the list of new DUTs
 */
function merge(from: IDut[], to: IDut[]) {
  // filter the DUTs that have been enrolled.
  const enrolled = toIterator(to)
    .filter(e => e.hostname !== '')
    .collect();

  // filter the DUTs are not enrolled and do not have test image.
  const withOutTestImage = toIterator(to)
    .filter(e => e.hostname === '' && !e.isConnected)
    .collect();

  // filter the DUTs that are not enrolled from old, we need copy the state from here.
  const old = toIterator(from)
    .filter(e => e.hostname === '' && e.isConnected)
    .collect();

  // filter the DUTs that are not enrolled from new, we need to update the state from old.
  const updated = toIterator(to)
    .filter(e => e.hostname === '' && e.isConnected)
    .collect();

  // update the new DUTs.
  const merged = toIterator(updated)
    .map(n => {
      return updateState(
        old.find(
          e =>
            e.address === n.address &&
            e.board === n.board &&
            e.model === n.model
        ),
        n
      );
    })
    .collect();

  return [
    ...enrolled.sort((a, b) => {
      return a.hostname.localeCompare(b.hostname);
    }),
    ...merged,
    ...withOutTestImage,
  ];
}

/**
 * update the DUT state from old to new.
 * @param from the old DUT state
 * @param to the new DUT state
 */
function updateState(from: IDut | undefined, to: IDut) {
  return {
    ...to,
    inputHostname: from?.inputHostname,
    inputBoard: from?.inputBoard !== undefined ? from.inputBoard : (to.board || ''),
    inputModel: from?.inputModel !== undefined ? from.inputModel : (to.model || ''),
  };
}

/**
 * find the old reference from the selection. the DUTs that we have selected.
 * @param selection the DUTs that we have selected
 * @param from the new reference of new DUTs
 */
function find(selection: SelectionModel<IDut>, from: IDut[]) {
  return toIterator(from)
    .filter(
      e =>
        selection.selected.find(obj => {
          if (obj.hostname === e.hostname && obj.hostname !== '') {
            return true;
          } else if (
            obj.address === e.address &&
            obj.board === e.board &&
            obj.model === e.model
          ) {
            return true;
          }
          return false;
        }) !== undefined
    )
    .collect();
}

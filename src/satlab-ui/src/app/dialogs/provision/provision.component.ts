import {AfterViewInit, Component, Inject} from '@angular/core';
import {BuildStatus, SelectableItem} from '../../models/selectable_item';
import {ISimpleDUT} from '../../models/dut';
import {BehaviorSubject} from 'rxjs';
import {toIterator} from '../../utils/iterator';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {NotificationService} from '../../services/notification.service';
import {defaultBuildSelectFields} from '../../models/run_suite_fields';

@Component({
  selector: 'app-provision',
  templateUrl: './provision.component.html',
  styleUrls: ['./provision.component.scss'],
})
export class ProvisionComponent implements AfterViewInit {
  protected poolOptions: SelectableItem[] = [];

  private readonly duts: ISimpleDUT[] = [];
  protected loading = new BehaviorSubject<{show: boolean; message: string}>({
    show: false,
    message: '',
  });
  protected loading$ = this.loading.asObservable();
  protected fields = {...defaultBuildSelectFields};

  constructor(
    @Inject(MAT_DIALOG_DATA) data: {duts: ISimpleDUT[]},
    private notification: NotificationService
  ) {
    this.duts = data.duts;
  }

  ngAfterViewInit(): void {
    this.__parsePoolOptionsFromDUTs(this.duts);
  }

  /**
   * onPoolChanged an event handler handles on pool changed.
   * @param newPool
   * @protected
   */
  protected onPoolChanged(newPool: string) {
    const d = toIterator(this.duts).first_where(e => e.pools.includes(newPool));

    if (d === null) {
      this.notification.error(
        `Unexpected: ${JSON.stringify(this.duts)}, pools: ${newPool}`,
        {dismiss: false}
      );
      return;
    }

    this.fields = {
      model: d.model,
      board: d.board,
      pool: newPool,
      milestone: '',
      build: '',
    };
  }

  /**
   * onBuildChanged hanldes milestone or build have been changed from the component.
   * @param newValue contains the milestone and build information
   * @protected
   */
  protected onBuildChanged(newValue: {milestone: string; build: string}) {
    this.fields = {
      ...this.fields,
      ...newValue,
    };
  }

  /**
   * __toSelectableItem changes the value to selectable item to option.
   * @param text
   * @param value
   * @param label
   * @private
   */
  private __toSelectableItem(
    text: string,
    value: string,
    label: BuildStatus
  ): SelectableItem {
    return {
      text: text,
      value: value,
      label: label,
    };
  }

  /**
   * __parsePoolOptionsFromDUTs fetch all pools from DUTs
   * @param duts the simple information of DUT that contains model, board, and pool.
   * @private
   */
  private __parsePoolOptionsFromDUTs(duts: ISimpleDUT[]): void {
    this.poolOptions = [];
    this.poolOptions = toIterator(duts)
      .map(e => e.pools)
      .flatten()
      .unique_by()
      .map(e => this.__toSelectableItem(e, e, ''))
      .collect();
  }

  /**
   * __showLoading show the loading indicator and message.
   * call this function when we want to call any API.
   * @param message
   * @private
   */
  private __showLoading(message: string) {
    this.loading.next({show: true, message: message});
  }

  /**
   * __hideLoading hide the loading indicator and message.
   * call this function when we call an API finished
   * @private
   */
  private __hideLoading() {
    this.loading.next({show: false, message: ''});
  }
}

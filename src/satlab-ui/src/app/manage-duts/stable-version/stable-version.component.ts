import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {IDut} from 'app/models/dut';

@Component({
  selector: 'app-stable-version',
  templateUrl: './stable-version.component.html',
  styleUrls: ['./stable-version.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StableVersionComponent implements OnChanges {
  @Input() DUTs: IDut[] = [];
  @Input() loading = false;

  protected data: {[key: string]: {[key: string]: boolean}} = {};

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('DUTs' in changes) {
      this.data = this.groupBy(changes.DUTs.currentValue);
    }
  }

  /**
   * group by board and model.
   */
  private groupBy(DUTs: IDut[]) {
    const result = {};
    for (const d of DUTs) {
      if (!(d.board in result)) {
        result[d.board] = {};
      }
      result[d.board][d.model] = true;
    }

    return result;
  }
}

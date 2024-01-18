import {ChangeDetectionStrategy, Component, Input} from '@angular/core';

@Component({
  selector: 'app-circular-progress',
  templateUrl: './circular-progress.component.html',
  styleUrls: ['./circular-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CircularProgressComponent {
  /* The size of the progress bar, we use `px` as the unit */
  @Input() size = 36;
  /* The background colour of the progress bar, we use hex */
  @Input() bg = '#eee';
  /* The foreground colour of the progress bar, we use hex */
  @Input() fg = '#107c10';
  /* The progress of the progress bar */
  @Input() progress = 0;
}

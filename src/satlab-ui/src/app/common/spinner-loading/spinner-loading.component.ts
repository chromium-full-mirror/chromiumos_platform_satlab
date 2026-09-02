import {Component, Input, ChangeDetectionStrategy} from '@angular/core';

@Component({
  selector: 'app-spinner-loading',
  templateUrl: './spinner-loading.component.html',
  styleUrls: ['./spinner-loading.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class SpinnerLoadingComponent {
  @Input() public isLoading: boolean = false;
}

import {Component, Input} from '@angular/core';

@Component({
    selector: 'app-spinner-loading',
    templateUrl: './spinner-loading.component.html',
    styleUrls: ['./spinner-loading.component.scss'],
    standalone: false
})
export class SpinnerLoadingComponent {
  @Input() public isLoading: boolean = false;
}

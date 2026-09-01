import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Observable} from 'rxjs';
import {LoadingComponent} from 'app/run_suite/common/loading/loading.component';

@Component({
    selector: 'app-test-options-card',
    imports: [CommonModule, LoadingComponent],
    templateUrl: './test-options-card.component.html',
    styleUrls: ['./test-options-card.component.scss']
})
export class TestOptionsCardComponent {
  @Input() errorMsg: string = '';
  @Input() loading$?: Observable<{show: boolean; message: string}>;
}

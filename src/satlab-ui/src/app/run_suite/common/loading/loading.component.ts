import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Observable, of, Subscription} from 'rxjs';
import {MatProgressBarModule} from '@angular/material/progress-bar';

@Component({
    selector: 'app-loading',
    templateUrl: './loading.component.html',
    styleUrls: ['./loading.component.scss'],
    imports: [MatProgressBarModule]
})
export class LoadingComponent implements OnInit, OnDestroy {
  @Input() loading$: Observable<{show: boolean; message: string}> = of({
    show: false,
    message: '',
  });

  protected show = false;
  protected message = '';

  private disposer?: Subscription;

  ngOnInit(): void {
    this.disposer = this.loading$.subscribe(e => {
      this.show = e.show;
      this.message = e.message;
    });
  }

  ngOnDestroy(): void {
    this.disposer?.unsubscribe();
  }
}

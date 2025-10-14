import {Component, effect, EventEmitter, Output, signal} from '@angular/core';

@Component({
  selector: 'app-test-plan',
  templateUrl: './test-plan.component.html',
  styleUrls: ['./test-plan.component.scss'],
})
export class TestPlanComponent {
  protected inputValue = signal('');

  @Output() changed = new EventEmitter<string>();

  constructor() {
    effect(
      () => {
        this.changed.emit(this.inputValue());
      },
      {
        allowSignalWrites: true,
      }
    );
  }

  protected onValueChanged(e: Event) {
    this.inputValue.set((e.target as HTMLInputElement).value);
  }
}

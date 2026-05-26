import {CommonModule} from '@angular/common';
import {
  Component,
  EventEmitter,
  Output,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-test-plan',
  templateUrl: './test-plan.component.html',
  styleUrls: ['./test-plan.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class TestPlanComponent {
  protected inputValue = signal('');

  @Output() changed = new EventEmitter<string>();

  protected onValueChanged(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    this.inputValue.set(val);
    this.changed.emit(val);
  }
}

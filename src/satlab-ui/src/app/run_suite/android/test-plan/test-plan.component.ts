import {CommonModule} from '@angular/common';
import {
  Component,
  EventEmitter,
  Output,
  computed,
  effect,
  signal,
} from '@angular/core';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';

@Component({
  selector: 'app-test-plan',
  templateUrl: './test-plan.component.html',
  styleUrls: ['./test-plan.component.scss'],
  standalone: true,
  imports: [CommonModule, MatSlideToggleModule],
})
export class TestPlanComponent {
  protected inputValue = signal('');
  protected autoQualValue = signal(false);
  protected autoQualActive = computed(() => {
    const supportList = ['avs/firmware', 'avs/release/initial'];
    const testplan = this.inputValue();
    return supportList.includes(testplan);
  });

  @Output() changed = new EventEmitter<string>();
  @Output() autoQual = new EventEmitter<boolean>();

  constructor() {
    effect(
      () => {
        // If auto-qual is not active, reset the auto-qual value and emit it.
        const active = this.autoQualActive();
        if (!active) {
          this.autoQualValue.set(false);
          this.autoQual.emit(false);
        }
      },
      {
        allowSignalWrites: true,
      }
    );

    effect(
      () => {
        this.autoQual.emit(this.autoQualValue());
      },
      {
        allowSignalWrites: true,
      }
    );
  }

  protected onValueChanged(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    this.inputValue.set(val);
    this.changed.emit(val);
  }

  protected onAutoQualChanged(value: boolean) {
    this.autoQualValue.set(value);
    this.autoQual.emit(value);
  }
}

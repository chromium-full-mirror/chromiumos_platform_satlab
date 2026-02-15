import {CommonModule, NgIf} from '@angular/common';
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
  imports: [CommonModule, MatSlideToggleModule, NgIf],
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
        this.changed.emit(this.inputValue());
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
    this.inputValue.set((e.target as HTMLInputElement).value);
  }

  protected onAutoQualChanged(value: boolean) {
    this.autoQualValue.set(value);
  }
}

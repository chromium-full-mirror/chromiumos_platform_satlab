import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-loading-button',
  templateUrl: './loading-button.component.html',
  styleUrls: ['./loading-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingButtonComponent {
  @Input() loading = false;
  @Input() disabled = false;
  @Input() text = '';

  @Output() onClick = new EventEmitter<void>();

  constructor() {}

  protected onButtonClicked() {
    this.onClick.emit();
  }
}

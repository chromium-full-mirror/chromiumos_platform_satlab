import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ChangeDetectionStrategy,
} from '@angular/core';
import {MomentDateAdapter} from '@angular/material-moment-adapter';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';

// Depending on whether rollup is used, moment needs to be imported differently.
// Since Moment.js doesn't have a default export, we normally need to import using the `* as`
// syntax. However, rollup creates a synthetic default module and we thus need to import it using
// the `default as` syntax.
import moment from 'moment';
import {FormControl} from '@angular/forms';
import {Subscription, distinctUntilChanged, map} from 'rxjs';
import {toEndDate, toStartDate} from 'app/utils/date_helper';

const MY_FORMATS = {
  parse: {
    dateInput: 'YYYY/MM/DD',
  },
  display: {
    dateInput: 'YYYY/MM/DD',
    monthYearLabel: 'YYYY MM',
  },
};

@Component({
  selector: 'app-custom-datepicker',
  templateUrl: './custom-datepicker.component.html',
  styleUrls: ['./custom-datepicker.component.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class CustomDatepickerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() value?: moment.Moment;
  @Input() invalid = false;
  @Input() label = 'Choose a date';

  @Output() dateChange = new EventEmitter<moment.Moment | null>();

  protected c = new FormControl();
  protected filter = this.#filter.bind(this);
  #disposer?: Subscription;

  constructor() {}

  ngOnInit(): void {
    if (this.value) {
      this.c.setValue(this.value);
    }

    this.#disposer = this.c.valueChanges
      .pipe(
        map(e => {
          const isValid = moment(e, 'YYYY/MM/DD', true).isValid();
          return isValid ? e : null;
        }),
        distinctUntilChanged()
      )
      .subscribe({
        next: e => {
          this.dateChange.emit(e);
        },
      });
  }

  ngOnDestroy(): void {
    this.#disposer?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const invalid =
      'invalid' in changes ? changes.invalid.currentValue : this.invalid;
    if (invalid) {
      this.c.setErrors({incorrect: true}, {emitEvent: true});
    } else {
      this.c.setErrors(null);
    }
  }

  #filter(d?: moment.Moment) {
    if (!d) {
      return false;
    }

    const now = toEndDate(moment());
    return d <= now;
  }

  /**
   * reset the the user input.
   */
  public reset(value?: moment.Moment) {
    this.c.reset();
    if (value) {
      this.c.setValue(value);
    }
  }
}

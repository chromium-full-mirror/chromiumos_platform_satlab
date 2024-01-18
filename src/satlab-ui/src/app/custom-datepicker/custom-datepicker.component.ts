import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
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
import * as _moment from 'moment';
// tslint:disable-next-line:no-duplicate-imports
import * as _rollupMoment from 'moment';
import {FormControl} from '@angular/forms';
import {Subscription, distinctUntilChanged, map} from 'rxjs';

const moment = _rollupMoment || _moment;

const MY_FORMATS = {
  parse: {
    dateInput: ['YYYY/MM/DD'],
  },
  display: {
    dateInput: 'YYYY/MM/DD',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
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
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ],
})
export class CustomDatepickerComponent implements OnInit, OnDestroy {
  @Input() value?: moment.Moment;
  @Input() filterDateLt?: moment.Moment;
  @Input() filterDateGt?: moment.Moment;
  @Input() maxDays = 30;
  @Input() errorMessage = '';
  @Input() label = 'Choose a date';

  @Output() dateChange = new EventEmitter<moment.Moment | null>();

  protected c = new FormControl();
  #disposer?: Subscription;

  constructor() {}

  ngOnInit(): void {
    if (this.value) {
      this.c.setValue(this.value);
    }

    this.#disposer = this.c.valueChanges
      .pipe(
        map(e => {
          if (e && '_i' in e) {
            let rawInput = '';
            if (typeof e._i === 'string') {
              rawInput = e._i;
            } else if (
              typeof e._i === 'object' &&
              'year' in e._i &&
              'month' in e._i &&
              typeof e._i.month === 'number' &&
              'date' in e._i
            ) {
              rawInput = `${e._i.year}/${e._i.month + 1}/${e._i.date}`;
            }

            const isValid =
              moment(e, 'YYYY/MM/DD', true).isValid() &&
              /\d{4}\/\d{1,2}\/\d{1,2}/gm.test(rawInput);
            return isValid ? e : null;
          } else {
            return null;
          }
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

  #filter(d?: moment.Moment) {
    if (!d) {
      return false;
    }

    const now = moment();
    let isValid = true;

    if (this.filterDateLt) {
      const begin = this.filterDateLt.clone().subtract(this.maxDays, 'days');
      isValid = isValid && d <= this.filterDateLt && d >= begin;
    }

    if (this.filterDateGt) {
      const end = this.filterDateGt.clone().add(30, 'days');
      isValid = isValid && d >= this.filterDateGt && d <= end;
    }

    return d <= now && isValid;
  }

  protected filter = this.#filter.bind(this);

  /**
   * clear the the user input.
   */
  public clear() {
    if (this.value) {
      this.c.setValue(this.value);
    } else {
      this.c.reset();
    }
  }
}

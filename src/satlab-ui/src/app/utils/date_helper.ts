import * as moment from 'moment';

/**
 * calculate the number of days between two dates in certain days.
 * @param from
 * @param to
 */
export function withinDays(
  from: moment.Moment,
  to: moment.Moment,
  days: number
): boolean {
  const duration = moment.duration(to.diff(from));
  return duration.asDays() <= days && duration.asDays() >= 0;
}

/**
 * toEndDate makes the date to YYYY/MM/dd 23:59:59
 */
export function toEndDate(d: moment.Moment) {
  return normalize(d).add(1, 'day').subtract(1, 'second');
}

/**
 * toStartDate makes the date to YYYY/MM/dd 00:00:00
 */
export function toStartDate(d: moment.Moment) {
  return normalize(d);
}

/**
 * normalize makes the date to YYYY/MM/dd 00:00:00.000
 */
function normalize(d: moment.Moment) {
  return d.hour(0).minute(0).second(0).millisecond(0).clone();
}

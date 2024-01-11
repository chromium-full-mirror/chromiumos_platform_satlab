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

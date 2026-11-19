import {
  Subscription,
  catchError,
  exhaustMap,
  from,
  map,
  of,
  takeWhile,
  timer,
} from 'rxjs';
import {NotificationService} from '../services/notification.service';
import {SatlabRpcService} from '../services/satlab-rpc.service';

const SCHEDUKE_TAG_MARKER = 'scheduke-admin-task';
const DEFAULT_INITIAL_DELAY_MS = 2000;
const DEFAULT_POLL_INTERVAL_MS = 3000;
const DEFAULT_MAX_WAIT_MS = 30 * 60 * 1000;
const DEFAULT_MAX_CONSECUTIVE_ERRORS = 10;
const GRPC_INVALID_ARGUMENT_CODE = 3;

export interface SchedukeTaskNotificationOptions {
  readonly service: Pick<SatlabRpcService, 'taskBuildLink'>;
  readonly notification: NotificationService;
  readonly taskUrl: string;
  readonly pendingMessage: string;
  readonly readyMessagePrefix: string;
  readonly timeoutMessage: string;
  readonly initialDelayMs?: number;
  readonly pollIntervalMs?: number;
  readonly maxWaitMs?: number;
  readonly maxConsecutiveErrors?: number;
}

/**
 * Returns true if the URL is a Scheduke Swarming tasklist filter URL rather than
 * a direct LUCI Buildbucket build link.
 */
export function isSchedukeTaskURL(url: string): boolean {
  return url.includes(SCHEDUKE_TAG_MARKER);
}

/**
 * Displays a notification for a scheduled admin task. When the task was queued
 * via Scheduke, hides the partner-inaccessible Swarming filter URL, polls until
 * Buildbucket creates the build, and updates the banner to the LUCI link.
 * Falls back to `timeoutMessage` on timeout, `INVALID_ARGUMENT`, or repeated
 * RPC errors, stops if the banner is dismissed or unsubscribed, and returns
 * `null` (without polling) when `taskUrl` is not a Scheduke URL.
 */
export function notifyWithSchedukeBuildLink(
  opts: SchedukeTaskNotificationOptions
): Subscription | null {
  if (!isSchedukeTaskURL(opts.taskUrl)) {
    opts.notification.info(
      [opts.readyMessagePrefix, {type: 'url', url: opts.taskUrl}],
      {dismiss: false}
    );
    return null;
  }

  const initialDelayMs = opts.initialDelayMs ?? DEFAULT_INITIAL_DELAY_MS;
  const pollIntervalMs = opts.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const maxWaitMs = opts.maxWaitMs ?? DEFAULT_MAX_WAIT_MS;
  const maxConsecutiveErrors =
    opts.maxConsecutiveErrors ?? DEFAULT_MAX_CONSECUTIVE_ERRORS;

  const notificationId = opts.notification.info(opts.pendingMessage, {
    dismiss: false,
  });
  const deadline = Date.now() + maxWaitMs;
  let consecutiveErrors = 0;
  let stopped = false;

  const sub = new Subscription();
  sub.add(() => {
    stopped = true;
  });

  const stopPolling = () => {
    stopped = true;
    sub.unsubscribe();
  };

  const showFallbackAndStop = () => {
    opts.notification.replace(notificationId, opts.timeoutMessage, {
      dismiss: false,
    });
    stopPolling();
  };

  type PollEvent =
    | {kind: 'ok'; res: {buildLink: string; isReady: boolean}}
    | {kind: 'err'; err: unknown};

  sub.add(
    timer(initialDelayMs, pollIntervalMs)
      .pipe(
        takeWhile(() => !stopped && opts.notification.has(notificationId)),
        exhaustMap(() =>
          from(opts.service.taskBuildLink(opts.taskUrl)).pipe(
            map((res): PollEvent => ({kind: 'ok', res})),
            catchError((err: unknown) => of<PollEvent>({kind: 'err', err}))
          )
        )
      )
      .subscribe({
        next: event => {
          if (stopped || !opts.notification.has(notificationId)) {
            stopPolling();
            return;
          }
          if (event.kind === 'ok') {
            consecutiveErrors = 0;
            if (event.res.isReady) {
              if (event.res.buildLink) {
                opts.notification.replace(
                  notificationId,
                  [
                    opts.readyMessagePrefix,
                    {type: 'url', url: event.res.buildLink},
                  ],
                  {dismiss: false}
                );
                stopPolling();
              } else {
                showFallbackAndStop();
              }
              return;
            }
            if (Date.now() >= deadline) {
              showFallbackAndStop();
            }
            return;
          }

          consecutiveErrors++;
          const isInvalidArgument =
            typeof event.err === 'object' &&
            event.err !== null &&
            'code' in event.err &&
            event.err.code === GRPC_INVALID_ARGUMENT_CODE;
          if (
            isInvalidArgument ||
            consecutiveErrors >= maxConsecutiveErrors ||
            Date.now() >= deadline
          ) {
            showFallbackAndStop();
          }
        },
        complete: stopPolling,
        error: stopPolling,
      })
  );

  return sub;
}

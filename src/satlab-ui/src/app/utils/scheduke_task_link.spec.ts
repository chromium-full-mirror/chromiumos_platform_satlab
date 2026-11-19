import {fakeAsync, tick} from '@angular/core/testing';
import {NotificationService} from '../services/notification.service';
import {SatlabRpcService} from '../services/satlab-rpc.service';
import {INotification} from '../models/notification';
import {
  isSchedukeTaskURL,
  notifyWithSchedukeBuildLink,
} from './scheduke_task_link';

describe('scheduke_task_link', () => {
  let notification: NotificationService;
  let mockService: jasmine.SpyObj<Pick<SatlabRpcService, 'taskBuildLink'>>;
  let latestNotifications: INotification[];

  beforeEach(() => {
    notification = new NotificationService();
    mockService = jasmine.createSpyObj('SatlabRpcService', ['taskBuildLink']);
    latestNotifications = [];
    notification.notification$.subscribe(n => {
      latestNotifications = n;
    });
  });

  it('detects Scheduke tasklist URLs', () => {
    expect(
      isSchedukeTaskURL(
        'https://chromeos-swarming.appspot.com/tasklist?f=scheduke-admin-task:dut-123&st=1'
      )
    ).toBeTrue();
    expect(isSchedukeTaskURL('https://ci.chromium.org/b/123')).toBeFalse();
  });

  it('shows non-Scheduke URL immediately without polling', () => {
    const sub = notifyWithSchedukeBuildLink({
      service: mockService,
      notification,
      taskUrl: 'https://ci.chromium.org/p/chromeos/builders/repair/b123',
      pendingMessage: 'pending',
      readyMessagePrefix: 'Repair dut1 succeed: ',
      timeoutMessage: 'timed out',
    });

    expect(sub).toBeNull();
    expect(mockService.taskBuildLink).not.toHaveBeenCalled();
    expect(latestNotifications.length).toBe(1);
    expect(latestNotifications[0].message).toEqual([
      'Repair dut1 succeed: ',
      {
        type: 'url',
        url: 'https://ci.chromium.org/p/chromeos/builders/repair/b123',
      },
    ]);
  });

  it('polls Scheduke URL and replaces pending banner with LUCI build link', fakeAsync(() => {
    mockService.taskBuildLink.and.returnValues(
      Promise.resolve({buildLink: '', isReady: false}),
      Promise.resolve({
        buildLink: 'https://ci.chromium.org/p/chromeos/builders/repair/b999',
        isReady: true,
      })
    );

    const taskUrl =
      'https://chromeos-swarming.appspot.com/tasklist?f=scheduke-admin-task:dut-123&st=1';
    const sub = notifyWithSchedukeBuildLink({
      service: mockService,
      notification,
      taskUrl,
      pendingMessage: 'Repair dut1 scheduled. Waiting for LUCI build link...',
      readyMessagePrefix: 'Repair dut1 succeed: ',
      timeoutMessage: 'timed out',
      initialDelayMs: 1000,
      pollIntervalMs: 1000,
    });

    expect(latestNotifications.length).toBe(1);
    expect(latestNotifications[0].message).toBe(
      'Repair dut1 scheduled. Waiting for LUCI build link...'
    );

    tick(1000);
    expect(mockService.taskBuildLink).toHaveBeenCalledTimes(1);
    expect(latestNotifications[0].message).toBe(
      'Repair dut1 scheduled. Waiting for LUCI build link...'
    );

    tick(1000);
    expect(mockService.taskBuildLink).toHaveBeenCalledTimes(2);
    expect(latestNotifications.length).toBe(1);
    expect(latestNotifications[0].message).toEqual([
      'Repair dut1 succeed: ',
      {
        type: 'url',
        url: 'https://ci.chromium.org/p/chromeos/builders/repair/b999',
      },
    ]);
    expect(sub?.closed).toBeTrue();
    tick(5000);
    expect(latestNotifications.length).toBe(1);
  }));

  it('stops polling if the user dismisses the pending notification', fakeAsync(() => {
    mockService.taskBuildLink.and.resolveTo({
      buildLink: '',
      isReady: false,
    });

    const sub = notifyWithSchedukeBuildLink({
      service: mockService,
      notification,
      taskUrl:
        'https://chromeos-swarming.appspot.com/tasklist?f=scheduke-admin-task:dut-123',
      pendingMessage: 'Repair dut1 scheduled. Waiting for LUCI build link...',
      readyMessagePrefix: 'Repair dut1 succeed: ',
      timeoutMessage: 'timed out',
      initialDelayMs: 1000,
      pollIntervalMs: 1000,
    });

    notification.dismiss(latestNotifications[0].id);
    tick(3000);

    expect(mockService.taskBuildLink).not.toHaveBeenCalled();
    expect(sub?.closed).toBeTrue();
  }));

  it('replaces banner with timeout message when maxWaitMs is exceeded', fakeAsync(() => {
    mockService.taskBuildLink.and.resolveTo({
      buildLink: '',
      isReady: false,
    });

    const sub = notifyWithSchedukeBuildLink({
      service: mockService,
      notification,
      taskUrl:
        'https://chromeos-swarming.appspot.com/tasklist?f=scheduke-admin-task:dut-123',
      pendingMessage: 'pending',
      readyMessagePrefix: 'ready: ',
      timeoutMessage: 'Repair dut1 queued in Scheduke.',
      initialDelayMs: 1000,
      pollIntervalMs: 1000,
      maxWaitMs: 1500,
    });

    tick(1000);
    tick(1000);

    expect(latestNotifications.length).toBe(1);
    expect(latestNotifications[0].message).toBe(
      'Repair dut1 queued in Scheduke.'
    );
    expect(sub?.closed).toBeTrue();
    tick(5000);
    expect(latestNotifications.length).toBe(1);
  }));

  it('falls back immediately when isReady is true with empty buildLink', fakeAsync(() => {
    mockService.taskBuildLink.and.resolveTo({
      buildLink: '',
      isReady: true,
    });

    const sub = notifyWithSchedukeBuildLink({
      service: mockService,
      notification,
      taskUrl:
        'https://chromeos-swarming.appspot.com/tasklist?f=scheduke-admin-task:dut-123',
      pendingMessage: 'pending',
      readyMessagePrefix: 'ready: ',
      timeoutMessage: 'Repair dut1 queued in Scheduke.',
      initialDelayMs: 1000,
      pollIntervalMs: 1000,
    });

    tick(1000);

    expect(mockService.taskBuildLink).toHaveBeenCalledTimes(1);
    expect(latestNotifications.length).toBe(1);
    expect(latestNotifications[0].message).toBe(
      'Repair dut1 queued in Scheduke.'
    );
    expect(sub?.closed).toBeTrue();
    tick(5000);
    expect(latestNotifications.length).toBe(1);
  }));

  it('falls back immediately on INVALID_ARGUMENT error', fakeAsync(() => {
    // Defer Promise.reject until poll tick so Zone/Node does not flag an unhandled rejection at setup time.
    mockService.taskBuildLink.and.callFake(() => Promise.reject({code: 3}));

    const sub = notifyWithSchedukeBuildLink({
      service: mockService,
      notification,
      taskUrl:
        'https://chromeos-swarming.appspot.com/tasklist?f=scheduke-admin-task:dut-123',
      pendingMessage: 'pending',
      readyMessagePrefix: 'ready: ',
      timeoutMessage: 'Repair dut1 queued in Scheduke.',
      initialDelayMs: 1000,
      pollIntervalMs: 1000,
    });

    tick(1000);

    expect(mockService.taskBuildLink).toHaveBeenCalledTimes(1);
    expect(latestNotifications.length).toBe(1);
    expect(latestNotifications[0].message).toBe(
      'Repair dut1 queued in Scheduke.'
    );
    expect(sub?.closed).toBeTrue();
  }));

  it('recovers from transient errors and resets consecutive error counter', fakeAsync(() => {
    const responses: Array<
      () => Promise<{buildLink: string; isReady: boolean}>
    > = [
      () => Promise.reject(new Error('transient 1')),
      () => Promise.resolve({buildLink: '', isReady: false}),
      () => Promise.reject(new Error('transient 2')),
      () =>
        Promise.resolve({
          buildLink: 'https://ci.chromium.org/p/chromeos/builders/repair/b777',
          isReady: true,
        }),
    ];
    let callIdx = 0;
    mockService.taskBuildLink.and.callFake(() => responses[callIdx++]());

    const sub = notifyWithSchedukeBuildLink({
      service: mockService,
      notification,
      taskUrl:
        'https://chromeos-swarming.appspot.com/tasklist?f=scheduke-admin-task:dut-123',
      pendingMessage: 'pending',
      readyMessagePrefix: 'Repair dut1 succeeded: ',
      timeoutMessage: 'timed out',
      initialDelayMs: 1000,
      pollIntervalMs: 1000,
      maxConsecutiveErrors: 2,
    });

    tick(1000);
    tick(1000);
    tick(1000);
    tick(1000);

    expect(mockService.taskBuildLink).toHaveBeenCalledTimes(4);
    expect(latestNotifications.length).toBe(1);
    expect(latestNotifications[0].message).toEqual([
      'Repair dut1 succeeded: ',
      {
        type: 'url',
        url: 'https://ci.chromium.org/p/chromeos/builders/repair/b777',
      },
    ]);
    expect(sub?.closed).toBeTrue();
  }));

  it('falls back after reaching maxConsecutiveErrors', fakeAsync(() => {
    mockService.taskBuildLink.and.callFake(() =>
      Promise.reject(new Error('unavailable'))
    );

    const sub = notifyWithSchedukeBuildLink({
      service: mockService,
      notification,
      taskUrl:
        'https://chromeos-swarming.appspot.com/tasklist?f=scheduke-admin-task:dut-123',
      pendingMessage: 'pending',
      readyMessagePrefix: 'ready: ',
      timeoutMessage: 'Repair dut1 queued in Scheduke.',
      initialDelayMs: 1000,
      pollIntervalMs: 1000,
      maxConsecutiveErrors: 2,
    });

    tick(1000);
    expect(latestNotifications[0].message).toBe('pending');
    expect(sub?.closed).toBeFalse();

    tick(1000);
    expect(mockService.taskBuildLink).toHaveBeenCalledTimes(2);
    expect(latestNotifications[0].message).toBe(
      'Repair dut1 queued in Scheduke.'
    );
    expect(sub?.closed).toBeTrue();
  }));

  it('does not mutate notification if unsubscribed while RPC is in flight', fakeAsync(() => {
    let resolvePoll!: (v: {buildLink: string; isReady: boolean}) => void;
    mockService.taskBuildLink.and.returnValue(
      new Promise(resolve => {
        resolvePoll = resolve;
      })
    );

    const sub = notifyWithSchedukeBuildLink({
      service: mockService,
      notification,
      taskUrl:
        'https://chromeos-swarming.appspot.com/tasklist?f=scheduke-admin-task:dut-123',
      pendingMessage: 'pending',
      readyMessagePrefix: 'ready: ',
      timeoutMessage: 'timed out',
      initialDelayMs: 1000,
      pollIntervalMs: 1000,
    });

    tick(1000);
    expect(mockService.taskBuildLink).toHaveBeenCalledTimes(1);

    sub?.unsubscribe();
    resolvePoll({
      buildLink: 'https://ci.chromium.org/p/chromeos/builders/repair/b999',
      isReady: true,
    });
    tick();

    expect(latestNotifications.length).toBe(1);
    expect(latestNotifications[0].message).toBe('pending');
  }));

  it('stops polling immediately when dismissed while RPC rejects', fakeAsync(() => {
    let rejectPoll!: (err: unknown) => void;
    mockService.taskBuildLink.and.returnValue(
      new Promise((_, reject) => {
        rejectPoll = reject;
      })
    );

    const sub = notifyWithSchedukeBuildLink({
      service: mockService,
      notification,
      taskUrl:
        'https://chromeos-swarming.appspot.com/tasklist?f=scheduke-admin-task:dut-123',
      pendingMessage: 'pending',
      readyMessagePrefix: 'ready: ',
      timeoutMessage: 'timed out',
      initialDelayMs: 1000,
      pollIntervalMs: 1000,
    });

    tick(1000);
    notification.dismiss(latestNotifications[0].id);
    rejectPoll(new Error('rpc failed'));
    tick();

    expect(sub?.closed).toBeTrue();
    tick(5000);
    expect(mockService.taskBuildLink).toHaveBeenCalledTimes(1);
  }));

  it('suppresses overlapping taskBuildLink calls while a poll is in flight', fakeAsync(() => {
    let resolveFirst!: (v: {buildLink: string; isReady: boolean}) => void;
    mockService.taskBuildLink.and.returnValue(
      new Promise(resolve => {
        resolveFirst = resolve;
      })
    );

    const sub = notifyWithSchedukeBuildLink({
      service: mockService,
      notification,
      taskUrl:
        'https://chromeos-swarming.appspot.com/tasklist?f=scheduke-admin-task:dut-123',
      pendingMessage: 'pending',
      readyMessagePrefix: 'ready: ',
      timeoutMessage: 'timed out',
      initialDelayMs: 1000,
      pollIntervalMs: 1000,
    });

    tick(1000);
    expect(mockService.taskBuildLink).toHaveBeenCalledTimes(1);

    // Advance past two additional poll intervals while the first RPC is still pending.
    tick(2000);
    expect(mockService.taskBuildLink).toHaveBeenCalledTimes(1);

    resolveFirst({
      buildLink: 'https://ci.chromium.org/p/chromeos/builders/repair/b777',
      isReady: true,
    });
    tick();

    expect(sub?.closed).toBeTrue();
    expect(latestNotifications[0].message).toEqual([
      'ready: ',
      {
        type: 'url',
        url: 'https://ci.chromium.org/p/chromeos/builders/repair/b777',
      },
    ]);
  }));
});

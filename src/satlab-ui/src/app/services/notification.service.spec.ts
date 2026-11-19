import {TestBed, fakeAsync, tick} from '@angular/core/testing';

import {INotification} from '../models/notification';
import {NotificationService} from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let latest: INotification[];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
    latest = [];
    service.notification$.subscribe(n => {
      latest = n;
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('replaces an active notification with explicit type and new id', () => {
    const id = service.info('pending', {dismiss: false});
    expect(service.has(id)).toBeTrue();

    const replacedId = service.replace(
      id,
      ['ready: ', {type: 'url', url: 'https://ci.chromium.org/b/1'}],
      {type: 'error', dismiss: false}
    );

    expect(replacedId).toBeTruthy();
    expect(replacedId).not.toBe(id);
    expect(service.has(id)).toBeFalse();
    expect(service.has(replacedId!)).toBeTrue();
    expect(latest).toEqual([
      {
        id: replacedId!,
        type: 'error',
        message: ['ready: ', {type: 'url', url: 'https://ci.chromium.org/b/1'}],
      },
    ]);
  });

  it('preserves existing notification type and list position when type is omitted', () => {
    const firstId = service.info('first', {dismiss: false});
    const secondId = service.error('second error', {dismiss: false});

    const inPlaceId = service.replace(secondId, 'updated error in place', {
      dismiss: false,
    });

    expect(inPlaceId).toBeTruthy();
    expect(latest).toEqual([
      {
        id: firstId,
        type: 'info',
        message: 'first',
      },
      {
        id: inPlaceId!,
        type: 'error',
        message: 'updated error in place',
      },
    ]);
  });

  it('returns null when replacing an already dismissed notification', () => {
    const id = service.info('pending', {dismiss: false});
    service.dismiss(id);

    expect(service.replace(id, 'late update', {dismiss: false})).toBeNull();
    expect(latest).toEqual([]);
  });

  it('auto-dismisses a replaced notification by default', fakeAsync(() => {
    const id = service.info('pending', {dismiss: false});

    const replacedId = service.replace(id, 'auto dismissed');
    expect(replacedId).toBeTruthy();
    expect(service.has(replacedId!)).toBeTrue();

    tick(4999);
    expect(service.has(replacedId!)).toBeTrue();
    expect(latest.length).toBe(1);

    tick(1);
    expect(service.has(replacedId!)).toBeFalse();
    expect(latest).toEqual([]);
  }));

  it('handles empty id safely in has and replace', () => {
    const activeId = service.info('active', {dismiss: false});

    expect(service.has('')).toBeFalse();
    expect(service.replace('', 'ignored', {dismiss: false})).toBeNull();
    expect(service.has(activeId)).toBeTrue();
    expect(latest.length).toBe(1);
  });

  it('ignores null or unformattable errors without emitting notifications', () => {
    expect(service.error(null, {dismiss: false})).toBe('');
    expect(service.error({}, {dismiss: false})).toBe('');
    expect(service.error('', {dismiss: false})).toBe('');
    expect(latest).toEqual([]);
  });
});

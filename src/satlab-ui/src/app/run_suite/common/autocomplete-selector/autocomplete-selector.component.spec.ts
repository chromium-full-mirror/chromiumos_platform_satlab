import {SimpleChange} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {SelectableItem} from '../../../models/selectable_item';

import {AutocompleteSelectorComponent} from './autocomplete-selector.component';

describe('AutocompleteSelectorComponent', () => {
  let component: AutocompleteSelectorComponent;
  let fixture: ComponentFixture<AutocompleteSelectorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AutocompleteSelectorComponent, NoopAnimationsModule],
    });
    fixture = TestBed.createComponent(AutocompleteSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should progressively render large option lists and filter across all options', fakeAsync(() => {
    const options: SelectableItem[] = Array.from({length: 220}, (_, idx) => ({
      label: '',
      value: `suite-${idx}`,
      text: `suite-${idx}`,
    }));
    component.ngOnChanges({
      options: new SimpleChange([], options, true),
    });
    fixture.detectChanges();

    const inputEl = fixture.nativeElement.querySelector(
      'input'
    ) as HTMLInputElement;
    inputEl.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('mat-list-item').length).toBe(
      50
    );

    const scrollContainer = fixture.nativeElement.querySelector(
      '.items-wrapper'
    ) as HTMLElement;
    Object.defineProperty(scrollContainer, 'scrollHeight', {
      value: 2400,
      configurable: true,
    });
    Object.defineProperty(scrollContainer, 'clientHeight', {
      value: 132,
      configurable: true,
    });
    scrollContainer.scrollTop = 2380;
    scrollContainer.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('mat-list-item').length).toBe(
      100
    );

    inputEl.value = 'suite-219';
    inputEl.dispatchEvent(new Event('input'));
    tick(200);
    fixture.detectChanges();

    const filteredItems =
      fixture.nativeElement.querySelectorAll('mat-list-item');
    expect(filteredItems.length).toBe(1);
    expect(filteredItems[0].textContent.trim()).toBe('suite-219');
  }));
});

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {SelectableItem} from '../../../models/selectable_item';

import {AutocompleteComponent} from './autocomplete.component';

describe('AutocompleteComponent', () => {
  let component: AutocompleteComponent;
  let fixture: ComponentFixture<AutocompleteComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AutocompleteComponent, NoopAnimationsModule],
    });
    fixture = TestBed.createComponent(AutocompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should progressively render large option lists in batches and filter across all options', () => {
    const options: SelectableItem[] = Array.from({length: 250}, (_, idx) => ({
      label: '',
      value: `branch-${idx}`,
      text: `branch-${idx}`,
    }));
    component.options = options;
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
      '.overflow-y-scroll'
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

    inputEl.value = 'branch-249';
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const filteredItems =
      fixture.nativeElement.querySelectorAll('mat-list-item');
    expect(filteredItems.length).toBe(1);
    expect(filteredItems[0].textContent.trim()).toBe('branch-249');
  });
});

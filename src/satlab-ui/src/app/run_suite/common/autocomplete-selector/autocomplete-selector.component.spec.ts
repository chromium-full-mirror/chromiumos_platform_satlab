import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AutocompleteSelectorComponent} from './autocomplete-selector.component';

describe('AutocompleteSelectorComponent', () => {
  let component: AutocompleteSelectorComponent;
  let fixture: ComponentFixture<AutocompleteSelectorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AutocompleteSelectorComponent],
    });
    fixture = TestBed.createComponent(AutocompleteSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

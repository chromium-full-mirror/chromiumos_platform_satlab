import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AdvanceSettingsComponent} from './advance-settings.component';

describe('AdvanceSettingsComponent', () => {
  let component: AdvanceSettingsComponent;
  let fixture: ComponentFixture<AdvanceSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdvanceSettingsComponent],
    });
    fixture = TestBed.createComponent(AdvanceSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

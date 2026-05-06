import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AndroidBuildPickerComponent} from './android-build-picker.component';

describe('AndroidBuildPickerComponent', () => {
  let component: AndroidBuildPickerComponent;
  let fixture: ComponentFixture<AndroidBuildPickerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AndroidBuildPickerComponent],
    });
    fixture = TestBed.createComponent(AndroidBuildPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TestSourcePickerComponent} from './test-source-picker.component';

describe('TestSourcePickerComponent', () => {
  let component: TestSourcePickerComponent;
  let fixture: ComponentFixture<TestSourcePickerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestSourcePickerComponent],
    });
    fixture = TestBed.createComponent(TestSourcePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

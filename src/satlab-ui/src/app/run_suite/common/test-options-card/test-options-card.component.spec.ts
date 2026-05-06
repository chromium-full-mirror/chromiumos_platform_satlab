import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TestOptionsCardComponent} from './test-options-card.component';

describe('TestOptionsCardComponent', () => {
  let component: TestOptionsCardComponent;
  let fixture: ComponentFixture<TestOptionsCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestOptionsCardComponent],
    });
    fixture = TestBed.createComponent(TestOptionsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

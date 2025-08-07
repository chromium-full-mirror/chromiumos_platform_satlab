import {TestPlanComponent} from './test-plan.component';
import {ComponentFixture, TestBed} from '@angular/core/testing';

describe('TestPlanComponent', () => {
  let component: TestPlanComponent;
  let fixture: ComponentFixture<TestPlanComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TestPlanComponent],
    });
    fixture = TestBed.createComponent(TestPlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

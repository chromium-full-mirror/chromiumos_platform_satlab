import {SuiteComponent} from './suite.component';
import {ComponentFixture, TestBed} from '@angular/core/testing';

describe('SuiteComponent', () => {
  let component: SuiteComponent;
  let fixture: ComponentFixture<SuiteComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SuiteComponent],
    });
    fixture = TestBed.createComponent(SuiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

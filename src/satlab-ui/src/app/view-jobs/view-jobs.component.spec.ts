import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ViewJobsComponent} from './view-jobs.component';

describe('ViewJobsComponent', () => {
  let component: ViewJobsComponent;
  let fixture: ComponentFixture<ViewJobsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ViewJobsComponent],
    });
    fixture = TestBed.createComponent(ViewJobsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

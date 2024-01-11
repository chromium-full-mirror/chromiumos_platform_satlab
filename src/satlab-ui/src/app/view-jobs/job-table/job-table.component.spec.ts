import {ComponentFixture, TestBed} from '@angular/core/testing';

import {JobTableComponent} from './job-table.component';

describe('JobTableComponent', () => {
  let component: JobTableComponent;
  let fixture: ComponentFixture<JobTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [JobTableComponent],
    });
    fixture = TestBed.createComponent(JobTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

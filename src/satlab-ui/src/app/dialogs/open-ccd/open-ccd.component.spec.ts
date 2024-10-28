import {ComponentFixture, TestBed} from '@angular/core/testing';

import {OpenCcdComponent} from './open-ccd.component';

describe('OpenCcdComponent', () => {
  let component: OpenCcdComponent;
  let fixture: ComponentFixture<OpenCcdComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OpenCcdComponent],
    });
    fixture = TestBed.createComponent(OpenCcdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

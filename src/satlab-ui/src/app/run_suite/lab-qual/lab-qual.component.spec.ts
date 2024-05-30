import {ComponentFixture, TestBed} from '@angular/core/testing';

import {LabQualComponent} from './lab-qual.component';

describe('BvtComponent', () => {
  let component: LabQualComponent;
  let fixture: ComponentFixture<LabQualComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LabQualComponent],
    });
    fixture = TestBed.createComponent(LabQualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

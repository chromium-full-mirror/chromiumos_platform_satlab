import {ComponentFixture, TestBed} from '@angular/core/testing';

import {LabqualComponent} from './labqual.component';

describe('LabqualComponent', () => {
  let component: LabqualComponent;
  let fixture: ComponentFixture<LabqualComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LabqualComponent],
    });
    fixture = TestBed.createComponent(LabqualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

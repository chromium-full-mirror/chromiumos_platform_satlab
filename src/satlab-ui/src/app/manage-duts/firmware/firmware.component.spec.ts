import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FirmwareComponent } from './firmware.component';

describe('FirmwareComponent', () => {
  let component: FirmwareComponent;
  let fixture: ComponentFixture<FirmwareComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FirmwareComponent]
    });
    fixture = TestBed.createComponent(FirmwareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageDutsComponent } from './manage-duts.component';

describe('ManageDutsComponent', () => {
  let component: ManageDutsComponent;
  let fixture: ComponentFixture<ManageDutsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ManageDutsComponent]
    });
    fixture = TestBed.createComponent(ManageDutsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

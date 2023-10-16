import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditDutsComponent } from './edit-duts.component';

describe('EditDutsComponent', () => {
  let component: EditDutsComponent;
  let fixture: ComponentFixture<EditDutsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditDutsComponent]
    });
    fixture = TestBed.createComponent(EditDutsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

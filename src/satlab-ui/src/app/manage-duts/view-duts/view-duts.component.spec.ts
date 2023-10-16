import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewDutsComponent } from './view-duts.component';

describe('ViewDutsComponent', () => {
  let component: ViewDutsComponent;
  let fixture: ComponentFixture<ViewDutsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ViewDutsComponent]
    });
    fixture = TestBed.createComponent(ViewDutsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

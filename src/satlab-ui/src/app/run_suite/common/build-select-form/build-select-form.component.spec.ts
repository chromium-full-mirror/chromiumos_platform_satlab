import {ComponentFixture, TestBed} from '@angular/core/testing';

import {BuildSelectFormComponent} from './build-select-form.component';

describe('BuildSelectFormComponent', () => {
  let component: BuildSelectFormComponent;
  let fixture: ComponentFixture<BuildSelectFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BuildSelectFormComponent],
    });
    fixture = TestBed.createComponent(BuildSelectFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

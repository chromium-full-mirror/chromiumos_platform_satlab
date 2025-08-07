import {AndroidBuildSelectFormComponent} from './android-build-select-form.component';
import {ComponentFixture, TestBed} from '@angular/core/testing';

describe('AndroidBuildSelectFormComponent', () => {
  let component: AndroidBuildSelectFormComponent;
  let fixture: ComponentFixture<AndroidBuildSelectFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AndroidBuildSelectFormComponent],
    });
    fixture = TestBed.createComponent(AndroidBuildSelectFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

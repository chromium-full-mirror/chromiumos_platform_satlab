import {ComponentFixture, TestBed} from '@angular/core/testing';

import {StableVersionComponent} from './stable-version.component';

describe('StableVersionComponent', () => {
  let component: StableVersionComponent;
  let fixture: ComponentFixture<StableVersionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StableVersionComponent],
    });
    fixture = TestBed.createComponent(StableVersionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

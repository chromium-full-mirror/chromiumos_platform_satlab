import {ComponentFixture, TestBed} from '@angular/core/testing';

import {StableVersionCardComponent} from './stable-version-card.component';

describe('StableVersionCardComponent', () => {
  let component: StableVersionCardComponent;
  let fixture: ComponentFixture<StableVersionCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StableVersionCardComponent],
    });
    fixture = TestBed.createComponent(StableVersionCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

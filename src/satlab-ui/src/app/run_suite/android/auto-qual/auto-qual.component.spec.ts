import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoQualComponent } from './auto-qual.component';

describe('AutoQualComponent', () => {
  let component: AutoQualComponent;
  let fixture: ComponentFixture<AutoQualComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AutoQualComponent]
    });
    fixture = TestBed.createComponent(AutoQualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

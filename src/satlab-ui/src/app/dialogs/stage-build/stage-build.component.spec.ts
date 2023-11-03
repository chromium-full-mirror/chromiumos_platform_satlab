import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StageBuildComponent } from './stage-build.component';

describe('StageBuildComponent', () => {
  let component: StageBuildComponent;
  let fixture: ComponentFixture<StageBuildComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StageBuildComponent]
    });
    fixture = TestBed.createComponent(StageBuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

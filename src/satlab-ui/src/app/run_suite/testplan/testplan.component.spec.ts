import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestplanComponent } from './testplan.component';

describe('TestplanComponent', () => {
  let component: TestplanComponent;
  let fixture: ComponentFixture<TestplanComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TestplanComponent]
    });
    fixture = TestBed.createComponent(TestplanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

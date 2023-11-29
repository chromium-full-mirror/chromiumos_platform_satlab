import {ComponentFixture, TestBed} from '@angular/core/testing';

import {BasicSelectorComponent} from './basic-selector.component';

describe('BasicSelectorComponent', () => {
  let component: BasicSelectorComponent;
  let fixture: ComponentFixture<BasicSelectorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BasicSelectorComponent],
    });
    fixture = TestBed.createComponent(BasicSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

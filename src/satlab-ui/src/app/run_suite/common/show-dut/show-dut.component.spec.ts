import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ShowDutComponent} from './show-dut.component';

describe('ShowDutComponent', () => {
  let component: ShowDutComponent;
  let fixture: ComponentFixture<ShowDutComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ShowDutComponent],
    });
    fixture = TestBed.createComponent(ShowDutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

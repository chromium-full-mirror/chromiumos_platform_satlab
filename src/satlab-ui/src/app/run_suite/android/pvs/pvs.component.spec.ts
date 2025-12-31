import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PvsComponent} from './pvs.component';

describe('PvsComponent', () => {
  let component: PvsComponent;
  let fixture: ComponentFixture<PvsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PvsComponent],
    });
    fixture = TestBed.createComponent(PvsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

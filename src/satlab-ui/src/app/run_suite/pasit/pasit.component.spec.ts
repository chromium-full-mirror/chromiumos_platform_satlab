import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PasitComponent} from './pasit.component';

describe('PasitComponent', () => {
  let component: PasitComponent;
  let fixture: ComponentFixture<PasitComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PasitComponent],
    });
    fixture = TestBed.createComponent(PasitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import {ComponentFixture, TestBed} from '@angular/core/testing';

import {WifiConfigComponent} from './wifi-config.component';

describe('WifiConfigComponent', () => {
  let component: WifiConfigComponent;
  let fixture: ComponentFixture<WifiConfigComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WifiConfigComponent],
    });
    fixture = TestBed.createComponent(WifiConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

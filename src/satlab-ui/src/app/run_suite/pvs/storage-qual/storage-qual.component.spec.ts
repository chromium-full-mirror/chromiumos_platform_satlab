import {ComponentFixture, TestBed} from '@angular/core/testing';

import {StorageQualComponent} from './storage-qual.component';

describe('StorageQualComponent', () => {
  let component: StorageQualComponent;
  let fixture: ComponentFixture<StorageQualComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StorageQualComponent],
    });
    fixture = TestBed.createComponent(StorageQualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

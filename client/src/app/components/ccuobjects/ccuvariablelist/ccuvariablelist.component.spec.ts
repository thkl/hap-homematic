import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CcuvariablelistComponent } from './ccuvariablelist.component';

describe('CcuvariablelistComponent', () => {
  let component: CcuvariablelistComponent;
  let fixture: ComponentFixture<CcuvariablelistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CcuvariablelistComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CcuvariablelistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

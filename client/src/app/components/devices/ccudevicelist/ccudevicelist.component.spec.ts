import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CcudevicelistComponent } from './ccudevicelist.component';

describe('CcudevicelistComponent', () => {
  let component: CcudevicelistComponent;
  let fixture: ComponentFixture<CcudevicelistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CcudevicelistComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CcudevicelistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

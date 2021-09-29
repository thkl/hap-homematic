import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CcuroomlistComponent } from './ccuroomlist.component';

describe('CcuroomlistComponent', () => {
  let component: CcuroomlistComponent;
  let fixture: ComponentFixture<CcuroomlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CcuroomlistComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CcuroomlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

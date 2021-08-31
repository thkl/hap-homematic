import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpeciallistComponent } from './speciallist.component';

describe('SpeciallistComponent', () => {
  let component: SpeciallistComponent;
  let fixture: ComponentFixture<SpeciallistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SpeciallistComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SpeciallistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

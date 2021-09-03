import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropdownmenuComponent } from './dropdownmenu.component';

describe('DropdownmenuComponent', () => {
  let component: DropdownmenuComponent;
  let fixture: ComponentFixture<DropdownmenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DropdownmenuComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DropdownmenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

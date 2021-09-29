import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResetsystemComponent } from './resetsystem.component';

describe('ResetsystemComponent', () => {
  let component: ResetsystemComponent;
  let fixture: ComponentFixture<ResetsystemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResetsystemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResetsystemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

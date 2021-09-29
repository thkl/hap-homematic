import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WizzardComponent } from './wizzard.component';

describe('WizzardComponent', () => {
  let component: WizzardComponent;
  let fixture: ComponentFixture<WizzardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WizzardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WizzardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

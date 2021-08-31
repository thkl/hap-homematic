import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemstateComponent } from './systemstate.component';

describe('SystemstateComponent', () => {
  let component: SystemstateComponent;
  let fixture: ComponentFixture<SystemstateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SystemstateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SystemstateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

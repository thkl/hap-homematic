import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepAppliancesComponent } from './step-appliances.component';

describe('StepAppliancesComponent', () => {
  let component: StepAppliancesComponent;
  let fixture: ComponentFixture<StepAppliancesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StepAppliancesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StepAppliancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

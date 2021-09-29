import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepInstancesComponent } from './step-instances.component';

describe('StepInstancesComponent', () => {
  let component: StepInstancesComponent;
  let fixture: ComponentFixture<StepInstancesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StepInstancesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StepInstancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

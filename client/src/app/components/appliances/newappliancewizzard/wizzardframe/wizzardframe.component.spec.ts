import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewApplianceWizzardFrameComponent } from './wizzardframe.component';

describe('NewApplianceWizzardFrameComponent', () => {
  let component: NewApplianceWizzardFrameComponent;
  let fixture: ComponentFixture<NewApplianceWizzardFrameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NewApplianceWizzardFrameComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewApplianceWizzardFrameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

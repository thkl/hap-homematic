import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppliancePropertiesComponent } from './applianceproperties.component';

describe('AppliancepropertiesComponent', () => {
  let component: AppliancePropertiesComponent;
  let fixture: ComponentFixture<AppliancePropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppliancePropertiesComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppliancePropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

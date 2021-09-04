import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppliancepropertiesComponent } from './applianceproperties.component';

describe('AppliancepropertiesComponent', () => {
  let component: AppliancepropertiesComponent;
  let fixture: ComponentFixture<AppliancepropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AppliancepropertiesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppliancepropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

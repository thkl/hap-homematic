import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditapplianceComponent } from './editappliance.component';

describe('EditapplianceComponent', () => {
  let component: EditapplianceComponent;
  let fixture: ComponentFixture<EditapplianceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditapplianceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditapplianceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

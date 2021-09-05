import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewDevicewizzardComponent } from './newdevicewizzard.component';

describe('NewdevicewizzardComponent', () => {
  let component: NewDevicewizzardComponent;
  let fixture: ComponentFixture<NewDevicewizzardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NewDevicewizzardComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewDevicewizzardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

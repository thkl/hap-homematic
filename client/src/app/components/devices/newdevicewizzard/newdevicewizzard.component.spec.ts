import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewdevicewizzardComponent } from './newdevicewizzard.component';

describe('NewdevicewizzardComponent', () => {
  let component: NewdevicewizzardComponent;
  let fixture: ComponentFixture<NewdevicewizzardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewdevicewizzardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewdevicewizzardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

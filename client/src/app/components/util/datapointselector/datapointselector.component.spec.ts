import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatapointselectorComponent } from './datapointselector.component';

describe('DatapointselectorComponent', () => {
  let component: DatapointselectorComponent;
  let fixture: ComponentFixture<DatapointselectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DatapointselectorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DatapointselectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

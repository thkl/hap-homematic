import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VariablelistComponent } from './variablelist.component';

describe('VariablelistComponent', () => {
  let component: VariablelistComponent;
  let fixture: ComponentFixture<VariablelistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VariablelistComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VariablelistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstancedetailComponent } from './instancedetail.component';

describe('InstancedetailComponent', () => {
  let component: InstancedetailComponent;
  let fixture: ComponentFixture<InstancedetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InstancedetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InstancedetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstancelistComponent } from './instancelist.component';

describe('InstancelistComponent', () => {
  let component: InstancelistComponent;
  let fixture: ComponentFixture<InstancelistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InstancelistComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InstancelistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

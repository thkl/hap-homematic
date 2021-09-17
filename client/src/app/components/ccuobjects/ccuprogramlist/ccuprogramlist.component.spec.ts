import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CCUProgramlistComponent } from './ccuprogramlist.component';

describe('CCUProgramlistComponent', () => {
  let component: CCUProgramlistComponent;
  let fixture: ComponentFixture<CCUProgramlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CCUProgramlistComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CCUProgramlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

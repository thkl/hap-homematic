import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramlistComponent } from './programlist.component';

describe('ProgramlistComponent', () => {
  let component: ProgramlistComponent;
  let fixture: ComponentFixture<ProgramlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProgramlistComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

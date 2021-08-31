import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppliancelistComponent } from './appliancelist.component';

describe('ApplicancelistComponent', () => {
  let component: AppliancelistComponent;
  let fixture: ComponentFixture<AppliancelistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AppliancelistComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppliancelistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

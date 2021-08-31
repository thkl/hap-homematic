import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppliancelistHeaderComponent } from './header_appliancelist.component';

describe('AppliancelistComponent', () => {
  let component: AppliancelistHeaderComponent;
  let fixture: ComponentFixture<AppliancelistHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppliancelistHeaderComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppliancelistHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrashlogsComponent } from './crashlogs.component';

describe('CrashlogsComponent', () => {
  let component: CrashlogsComponent;
  let fixture: ComponentFixture<CrashlogsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CrashlogsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CrashlogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

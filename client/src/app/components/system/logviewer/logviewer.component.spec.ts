import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogViewerComponent } from './logviewer.component';

describe('LogviewerComponent', () => {
  let component: LogViewerComponent;
  let fixture: ComponentFixture<LogViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LogViewerComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LogViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

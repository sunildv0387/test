import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WritestoryComponent } from './writestory.component';

describe('WritestoryComponent', () => {
  let component: WritestoryComponent;
  let fixture: ComponentFixture<WritestoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WritestoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WritestoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorytitleComponent } from './storytitle.component';

describe('StorytitleComponent', () => {
  let component: StorytitleComponent;
  let fixture: ComponentFixture<StorytitleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorytitleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StorytitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

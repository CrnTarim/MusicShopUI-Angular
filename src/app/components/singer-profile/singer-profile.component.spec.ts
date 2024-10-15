import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingerProfileComponent } from './singer-profile.component';

describe('SingerProfileComponent', () => {
  let component: SingerProfileComponent;
  let fixture: ComponentFixture<SingerProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SingerProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SingerProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SinglesongsComponent } from './singlesongs.component';

describe('SinglesongsComponent', () => {
  let component: SinglesongsComponent;
  let fixture: ComponentFixture<SinglesongsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SinglesongsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SinglesongsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

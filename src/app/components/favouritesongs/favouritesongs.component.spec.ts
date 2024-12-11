import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FavouritesongsComponent } from './favouritesongs.component';

describe('FavouritesongsComponent', () => {
  let component: FavouritesongsComponent;
  let fixture: ComponentFixture<FavouritesongsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FavouritesongsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FavouritesongsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

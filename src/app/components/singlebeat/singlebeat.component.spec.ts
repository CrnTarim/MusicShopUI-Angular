import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SinglebeatComponent } from './singlebeat.component';

describe('SinglebeatComponent', () => {
  let component: SinglebeatComponent;
  let fixture: ComponentFixture<SinglebeatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SinglebeatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SinglebeatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

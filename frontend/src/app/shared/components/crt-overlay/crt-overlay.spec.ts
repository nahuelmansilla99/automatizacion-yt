import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrtOverlayComponent } from './crt-overlay';

describe('CrtOverlayComponent', () => {
  let fixture: ComponentFixture<CrtOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrtOverlayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CrtOverlayComponent);
  });

  it('debería crearse correctamente y tener los elementos de scanlines y reveal', async () => {
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.machine-scanlines')).toBeTruthy();
    expect(el.querySelector('.machine-reveal')).toBeTruthy();
  });
});

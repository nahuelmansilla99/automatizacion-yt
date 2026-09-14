import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NavbarComponent } from './navbar';
import { SummariesStore } from '../../../features/dashboard/store/summaries.store';

describe('NavbarComponent', () => {
  let fixture: ComponentFixture<NavbarComponent>;
  let wsConnectedSignal: ReturnType<typeof signal<boolean>>;

  beforeEach(async () => {
    wsConnectedSignal = signal(true);

    const mockStore = {
      isWsConnected: wsConnectedSignal.asReadonly(),
    };

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        { provide: SummariesStore, useValue: mockStore },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
  });

  it('debería renderizar el título de la aplicación', async () => {
    // Wait
    await fixture.whenStable();

    // Assert
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Obsidian YT Resúmenes');
  });

  it('debería indicar "En vivo" cuando el WebSocket está conectado', async () => {
    // Act
    wsConnectedSignal.set(true);

    // Wait
    await fixture.whenStable();

    // Assert
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('En vivo');
  });

  it('debería indicar "Desconectado" cuando el WebSocket no está conectado', async () => {
    // Act
    wsConnectedSignal.set(false);

    // Wait
    await fixture.whenStable();

    // Assert
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Desconectado');
  });
});

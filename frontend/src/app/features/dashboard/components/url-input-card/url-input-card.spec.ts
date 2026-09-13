import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { UrlInputCardComponent } from './url-input-card';
import { SummariesStore } from '../../store/summaries.store';

describe('UrlInputCardComponent', () => {
  let component: UrlInputCardComponent;
  let fixture: ComponentFixture<UrlInputCardComponent>;
  let requestSummarySpy: ReturnType<typeof vi.fn>;
  let submittingSignal: ReturnType<typeof signal<boolean>>;

  beforeEach(async () => {
    submittingSignal = signal(false);
    requestSummarySpy = vi.fn();

    const mockStore = {
      submitting: submittingSignal.asReadonly(),
      requestSummary: requestSummarySpy,
    };

    await TestBed.configureTestingModule({
      imports: [UrlInputCardComponent],
      providers: [
        { provide: SummariesStore, useValue: mockStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UrlInputCardComponent);
    component = fixture.componentInstance;
  });

  it('debería validar correctamente una URL de YouTube', async () => {
    // Act
    component.url.set('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    component.onUrlChange(component.url());

    // Wait
    await fixture.whenStable();

    // Assert
    expect(component.isValidUrl()).toBe(true);
    expect(component.hasError()).toBe(false);
  });

  it('debería marcar error si la URL ingresada no es de YouTube', async () => {
    // Act
    component.onUrlChange('https://google.com');

    // Wait
    await fixture.whenStable();

    // Assert
    expect(component.hasError()).toBe(true);
    expect(component.isValidUrl()).toBe(false);
  });

  it('debería limpiar la URL al invocar clearUrl', async () => {
    // Act
    component.url.set('https://youtu.be/dQw4w9WgXcQ');
    component.clearUrl();

    // Wait
    await fixture.whenStable();

    // Assert
    expect(component.url()).toBe('');
    expect(component.hasError()).toBe(false);
  });

  it('debería invocar store.requestSummary al enviar una URL válida', async () => {
    // Act
    const validUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    component.url.set(validUrl);
    const event = new Event('submit');
    component.onSubmit(event);

    // Wait
    await fixture.whenStable();

    // Assert
    expect(requestSummarySpy).toHaveBeenCalledWith(validUrl, expect.any(Function));
  });
});

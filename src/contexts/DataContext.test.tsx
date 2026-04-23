import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DataProvider, useData } from '@/contexts/DataContext';
import { useTrips } from '@/hooks/useTrips';

const toastMock = vi.fn();

vi.mock('@/hooks/useTrips', () => ({
  useTrips: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

vi.mock('@/services/supabaseService', () => ({
  fetchEvaluations: vi.fn().mockResolvedValue([]),
  upsertEvaluation: vi.fn(),
  fetchDriverBlocks: vi.fn().mockResolvedValue([]),
  unblockDriver: vi.fn(),
  resetManualOverride: vi.fn(),
  createEvaluationLog: vi.fn(),
  fetchDrivers: vi.fn().mockResolvedValue([]),
  blockDriver: vi.fn(),
}));

vi.mock('@/services/routeScoreService', () => ({
  fetchRouteScores: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/services/vinculoService', () => ({
  fetchVinculos: vi.fn().mockResolvedValue([]),
  getVinculoForDriver: vi.fn(() => '—'),
  clearVinculoCache: vi.fn(),
}));

function Probe() {
  const { trips, drivers, activeDrivers } = useData();

  return (
    <div data-testid="state">
      {JSON.stringify({
        trips: trips.length,
        drivers: drivers.length,
        activeDrivers: activeDrivers.length,
      })}
    </div>
  );
}

describe('DataProvider', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    localStorage.clear();
    toastMock.mockReset();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('does not fall back to mock drivers when sheet data is unavailable', async () => {
    vi.mocked(useTrips).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refresh: vi.fn(),
    } as ReturnType<typeof useTrips>);

    await act(async () => {
      root.render(
        <DataProvider>
          <Probe />
        </DataProvider>
      );

      await Promise.resolve();
    });

    expect(container.textContent).toContain('"trips":0');
    expect(container.textContent).toContain('"drivers":0');
    expect(container.textContent).toContain('"activeDrivers":0');
  });
});

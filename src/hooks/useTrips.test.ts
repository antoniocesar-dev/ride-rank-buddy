import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { clearCache } from '@/services/sheetsService';
import { useTrips } from '@/hooks/useTrips';

const refetchMock = vi.fn();
const invalidateQueriesMock = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock('@/services/sheetsService', () => ({
  getTrips: vi.fn(),
  clearCache: vi.fn(),
}));

function HookProbe({ onReady }: { onReady: (value: ReturnType<typeof useTrips>) => void }) {
  onReady(useTrips());
  return null;
}

describe('useTrips', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    refetchMock.mockReset();
    invalidateQueriesMock.mockReset();

    vi.mocked(useQueryClient).mockReturnValue({
      invalidateQueries: invalidateQueriesMock,
    } as unknown as ReturnType<typeof useQueryClient>);

    vi.mocked(useQuery).mockReturnValue({
      refetch: refetchMock,
    } as ReturnType<typeof useQuery>);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('loads sheet data automatically on mount', () => {
    let capturedHook: ReturnType<typeof useTrips> | null = null;

    act(() => {
      root.render(createElement(HookProbe, {
        onReady: (value) => {
          capturedHook = value;
        },
      }));
    });

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
      })
    );
    expect(capturedHook).not.toBeNull();
  });

  it('clears the cache and refetches when refreshing manually', () => {
    let capturedHook: ReturnType<typeof useTrips> | null = null;

    act(() => {
      root.render(createElement(HookProbe, {
        onReady: (value) => {
          capturedHook = value;
        },
      }));
    });

    act(() => {
      capturedHook?.refresh();
    });

    expect(clearCache).toHaveBeenCalled();
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ['sheet-trips'] });
    expect(refetchMock).toHaveBeenCalled();
  });
});

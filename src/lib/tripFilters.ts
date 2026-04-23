interface TripLike {
  driver_id: string;
  origin_code: string;
  destination_code: string;
}

const EMPTY_VINCULO_VALUES = new Set(["", "-", "\u2014", "\u00e2\u20ac\u201d"]);

function normalizeRouteCode(code: string): string {
  const normalized = code.trim();
  return normalized || "-";
}

export function getRouteKey(originCode: string, destinationCode: string): string {
  return `${normalizeRouteCode(originCode)}::${normalizeRouteCode(destinationCode)}`;
}

export function getRouteLabel(originCode: string, destinationCode: string): string {
  return `${normalizeRouteCode(originCode)} -> ${normalizeRouteCode(destinationCode)}`;
}

export function getDriverVinculoLabel(vinculo?: string | null): string {
  const normalized = (vinculo ?? "").trim();
  return EMPTY_VINCULO_VALUES.has(normalized) ? "Terceiros" : normalized;
}

export function filterTripsBySelections<T extends TripLike>(
  trips: T[],
  driverVinculos: ReadonlyMap<string, string>,
  selectedVinculos: string[],
  selectedRoutes: string[]
): T[] {
  return trips.filter(trip => {
    const vinculo = driverVinculos.get(trip.driver_id) ?? "Terceiros";
    const routeKey = getRouteKey(trip.origin_code, trip.destination_code);

    if (selectedVinculos.length > 0 && !selectedVinculos.includes(vinculo)) {
      return false;
    }

    if (selectedRoutes.length > 0 && !selectedRoutes.includes(routeKey)) {
      return false;
    }

    return true;
  });
}

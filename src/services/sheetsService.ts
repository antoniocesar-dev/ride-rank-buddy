const SHEET_ID = "1MWTiaXU3HXW_iVn-n70WSk3o8rcHTRrQP2ac07W9cCU";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

export interface SheetTrip {
  sta_origin_date: string;
  trip_number: string;
  status_agrupado: string;
  solicitation_by: string;
  planned_vehicle: string;
  used_vehicle: string;
  used_agency_name: string;
  driver_id: string;
  driver_name: string;
  vehicle_number: string;
  origin_station_code: string;
  destination_station_code: string;
  eta_scheduled_origin_edited: string;
  cpt_scheduled_origin_edited: string;
  eta_destination_edited: string;
  id_rota: string;
  eta_realizado: string;
  status_eta: string;
  ocorrencia_eta: string;
  cpt_realizado: string;
  status_cpt: string;
  ocorrencia_cpt: string;
  eta_destino_realizado: string;
  status_eta_destino: string;
  ocorrencia_eta_destino: string;
  horario_de_descarga: string;
  sum_orders: string;
  checkin_origin_operator: string;
  checkout_origin_operator: string;
  checkin_destination_operator: string;
  eta_origin_realized: string;
  cpt_origin_realized: string;
  eta_destination_realized: string;
  atualizacao: string;
  [key: string]: string; // flexibility for unknown columns
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(csv: string): SheetTrip[] {
  const lines = csv.split("\n").filter((line) => line.trim() !== "");
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.replace(/^"|"$/g, "").trim());

  const trips: SheetTrip[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    // Skip empty rows
    if (values.every((v) => v === "" || v === '""')) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      if (header) {
        row[header] = (values[idx] || "").replace(/^"|"$/g, "").trim();
      }
    });

    // Only include rows that have at least a trip_number
    if (row.trip_number) {
      trips.push(row as SheetTrip);
    }
  }

  return trips;
}

let cachedTrips: SheetTrip[] | null = null;
let fetchPromise: Promise<SheetTrip[]> | null = null;

export async function getTrips(): Promise<SheetTrip[]> {
  if (cachedTrips) return cachedTrips;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const response = await fetch(CSV_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch sheet: ${response.status}`);
      }
      const csv = await response.text();
      cachedTrips = parseCSV(csv);
      console.log(`[SheetsService] Loaded ${cachedTrips.length} trips from Google Sheets`);
      return cachedTrips;
    } catch (error) {
      console.error("[SheetsService] Error fetching sheet data:", error);
      cachedTrips = [];
      return cachedTrips;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

export function clearCache() {
  cachedTrips = null;
}

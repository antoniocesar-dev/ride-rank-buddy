const SHEET_ID = "1l0dI0cphGpddSWgPx65hyVTqAm5i7H4RlXo4h2OzIMU";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

export interface VinculoRecord {
  motorista: string;
  vinculo: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
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

let cached: VinculoRecord[] | null = null;

export async function fetchVinculos(): Promise<VinculoRecord[]> {
  if (cached) return cached;
  try {
    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const csv = await res.text();
    const lines = csv.split("\n").filter(l => l.trim());
    if (lines.length < 2) return [];

    const records: VinculoRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = parseCSVLine(lines[i]);
      const motorista = (vals[0] || "").replace(/^"|"$/g, "").trim();
      const vinculo = (vals[1] || "").replace(/^"|"$/g, "").trim();
      if (motorista && vinculo) {
        records.push({ motorista, vinculo });
      }
    }
    cached = records;
    console.log(`[VinculoService] Loaded ${records.length} vinculos`);
    return records;
  } catch (e) {
    console.error("[VinculoService] Error:", e);
    return [];
  }
}

export function clearVinculoCache() {
  cached = null;
}

function normalize(name: string): string {
  return name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export function getVinculoForDriver(vinculos: VinculoRecord[], driverName: string): string {
  const norm = normalize(driverName);
  const match = vinculos.find(v => normalize(v.motorista) === norm);
  return match?.vinculo || '—';
}

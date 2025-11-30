import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuoteStore } from "@/store/useQuoteStore";
import {
  Plane,
  Ship,
  Truck,
  Clock,
  Anchor,
  Calendar,
  Map as MapIcon,
} from "lucide-react";
import { TransportMode, Incoterm } from "@/types/index";

// -----------------------------------------------------------------------------
// MAP CONFIG
// -----------------------------------------------------------------------------

const MAP_WIDTH = 784.077;
const MAP_HEIGHT = 458.627;
const WORLD_MAP_URL = "/world-map-dark.svg";

type PortGeo = { lat: number; lon: number };

const PORT_GEO: Record<string, PortGeo> = {
  "CASABLANCA (MAP)": { lat: 8.0,  lon: -16.0 },
  "TANGER MED (MAP)": { lat: 10.3, lon: -13.9 },
  "AGADIR (MAP)":      { lat: 4.8,  lon: -18.0 },
  "ROTTERDAM (NL)":    { lat: 26.3, lon: -3.9 },
  "HAMBURG (DE)":      { lat: 27.9, lon: 1.6 },
  "VALENCIA (ES)":     { lat: 13.9, lon: -8.8 },
  "MARSEILLE (FR)":    { lat: 17.7, lon: -3.0 },
  "SHANGHAI (CN)":     { lat: 5.6,   lon: 113.1 },
  "NINGBO (CN)":       { lat: 4.3,   lon: 113.2 },
  "DUBAI (AE)":        { lat: -0.3,  lon: 46.9 },
  "SINGAPORE (SG)":    { lat: -24.25, lon: 95.4 },
  "NEW YORK (US)":     { lat: 15.1,  lon: -82.4 },
  "LOS ANGELES (US)":  { lat: 8.4,   lon: -126.6 },
  "SANTOS (BR)":       { lat: -49.55, lon: -54.73 },
};

function project(lat: number, lon: number) {
  const x = ((lon + 180) / 360) * MAP_WIDTH;
  const y = ((90 - lat) / 180) * MAP_HEIGHT;
  return { x, y };
}

function getPortCoords(name: string) {
  const geo = PORT_GEO[name];
  if (!geo) {
    return { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 };
  }
  return project(geo.lat, geo.lon);
}

function inferHub(pol: string, pod: string, mode: TransportMode): string | null {
  const sea = mode.startsWith("SEA");
  const air = mode === "AIR";
  const isEUorNA = (p: string) => /(CASABLANCA|TANGER|AGADIR|ROTTERDAM|HAMBURG|VALENCIA|MARSEILLE|NEW YORK|LOS ANGELES)/.test(p);
  const isAsia = (p: string) => /(SHANGHAI|NINGBO|SINGAPORE|DUBAI)/.test(p);
  const isSouthAmerica = (p: string) => /SANTOS/.test(p);

  if (sea && isEUorNA(pol) && isAsia(pod)) return "SUEZ / MED MAINLINE";
  if (sea && isAsia(pol) && isEUorNA(pod)) return "SUEZ / MED MAINLINE";
  if (sea && isEUorNA(pol) && isSouthAmerica(pod)) return "ATLANTIC MAINLINE";
  if (sea && isSouthAmerica(pol) && isEUorNA(pod)) return "ATLANTIC MAINLINE";
  if (air && isEUorNA(pol) && isAsia(pod)) return "MIDDLE EAST HUB";
  if (air && isAsia(pol) && isEUorNA(pod)) return "MIDDLE EAST HUB";
  return null;
}

function formatShortDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function computeEtaFromTransit(requestedDepartureDate: string | null, transitTime: number): string | null {
  if (!requestedDepartureDate || !transitTime || transitTime <= 0) return null;
  const d = new Date(requestedDepartureDate);
  if (Number.isNaN(d.getTime())) return null;
  const eta = new Date(d.getTime());
  eta.setDate(eta.getDate() + transitTime);
  return eta.toISOString().slice(0, 10);
}

const WorldMap = ({ pol, pod, mode, transitTime, requestedDepartureDate, estimatedArrivalDate }: any) => {
  const start = getPortCoords(pol);
  const end = getPortCoords(pod);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const arcHeight = mode === "AIR" ? dist * 0.35 : dist * 0.22;
  const cx = (start.x + end.x) / 2;
  const cy = Math.min(start.y, end.y) - arcHeight;
  const pathD = `M${start.x},${start.y} Q${cx},${cy} ${end.x},${end.y}`;
  const routeColor = mode === "AIR" ? "#fbbf24" : mode === "ROAD" ? "#22c55e" : "#3b82f6";
  const distanceKm = Math.round(dist * 0.5);
  const hub = inferHub(pol, pod, mode);
  const etdShort = formatShortDate(requestedDepartureDate);
  const etaIso = estimatedArrivalDate || computeEtaFromTransit(requestedDepartureDate, transitTime);
  const etaShort = formatShortDate(etaIso);
  const effectiveTransit = transitTime || (etaIso && requestedDepartureDate ? Math.round((new Date(etaIso).getTime() - new Date(requestedDepartureDate).getTime()) / (1000 * 60 * 60 * 24)) : null);

  return (
    // REMOVED SHADOW HERE
    <div className="relative w-full h-64 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.95),_transparent_65%)]" />
      <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="darkenOverlay" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(15,23,42,0.6)" />
            <stop offset="100%" stopColor="rgba(15,23,42,0.9)" />
          </linearGradient>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={routeColor} stopOpacity="0" />
            <stop offset="35%" stopColor={routeColor} stopOpacity="0.9" />
            <stop offset="65%" stopColor={routeColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={routeColor} stopOpacity="0" />
          </linearGradient>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <image x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} preserveAspectRatio="xMidYMid slice" xlinkHref={WORLD_MAP_URL} />
        <rect x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#darkenOverlay)" />
        <g opacity={0.25}>
          {Array.from({ length: 13 }).map((_, i) => (
            <line key={`v-${i}`} x1={(MAP_WIDTH / 12) * i} y1={0} x2={(MAP_WIDTH / 12) * i} y2={MAP_HEIGHT} stroke="#1e293b" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 7 }).map((_, i) => (
            <line key={`h-${i}`} x1={0} y1={(MAP_HEIGHT / 6) * i} x2={MAP_WIDTH} y2={(MAP_HEIGHT / 6) * i} stroke="#1e293b" strokeWidth="0.5" />
          ))}
        </g>
        <g filter="url(#softGlow)">
          <path d={pathD} fill="none" stroke="url(#routeGradient)" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 8">
            <animate attributeName="stroke-dashoffset" from="40" to="0" dur="3s" repeatCount="indefinite" />
          </path>
          <circle r="4" fill="#f9fafb">
            <animateMotion dur="4.2s" repeatCount="indefinite" path={pathD} rotate="auto" />
          </circle>
          <g>
            <circle cx={start.x} cy={start.y} r="4" fill={routeColor} />
            <circle cx={start.x} cy={start.y} r="10" fill="none" stroke={routeColor} strokeWidth="1" opacity="0.6">
              <animate attributeName="r" from="6" to="12" dur="1.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.9" to="0" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <text x={start.x} y={start.y - 10} fontSize="10" fill="#e5e7eb" textAnchor="middle" fontWeight="600">POL</text>
          </g>
          <g>
            <circle cx={end.x} cy={end.y} r="4" fill="#22c55e" />
            <circle cx={end.x} cy={end.y} r="10" fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.6">
              <animate attributeName="r" from="6" to="12" dur="1.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.9" to="0" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <text x={end.x} y={end.y + 14} fontSize="10" fill="#bbf7d0" textAnchor="middle" fontWeight="600">POD</text>
          </g>
        </g>
      </svg>
      <div className="pointer-events-none absolute inset-x-4 top-3 flex items-center justify-between text-[11px] font-medium text-slate-300">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-slate-700/70 bg-slate-900/80 px-2 py-0.5">{pol || "SET POL"}</span>
          <span className="mx-1 text-slate-500">→</span>
          <span className="rounded-full border border-slate-700/70 bg-slate-900/80 px-2 py-0.5">{pod || "SET POD"}</span>
          {hub && <span className="ml-2 rounded-full border border-slate-700/70 bg-slate-900/80 px-2 py-0.5 text-[10px] text-sky-300">Via {hub}</span>}
        </div>
        <div className="flex items-center gap-2">
          {etdShort && <span className="rounded-full border border-slate-800 bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-300">ETD {etdShort}{etaShort ? ` · ETA ${etaShort}` : ""}</span>}
          <span className="rounded-full border border-slate-700/70 bg-slate-900/90 px-2 py-0.5 uppercase tracking-[0.08em]">{mode.replace("_", " ")}</span>
          <span className="rounded-full border border-slate-800 bg-slate-900/90 px-2 py-0.5 font-mono text-[10px]">~{distanceKm.toLocaleString()} km</span>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-4 bottom-3 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="h-1 w-4 rounded-full bg-slate-400/80" /> Grid</span>
          <span className="flex items-center gap-1"><span className="h-1 w-4 rounded-full bg-sky-400/90" /> Route</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Destination</span>
        </div>
        <div className="flex items-center gap-2">
          {effectiveTransit && <span className="rounded-full border border-slate-800 bg-slate-900/90 px-2 py-0.5 font-mono">{effectiveTransit} d</span>}
          {hub && pol && pod && (
            <span className="hidden sm:flex items-center gap-2 text-slate-300">
              <span className="rounded-full bg-slate-900/90 px-2 py-0.5 border border-slate-800">Leg 1 · {pol.split(" (")[0]} → {hub}</span>
              <span className="rounded-full bg-slate-900/90 px-2 py-0.5 border border-slate-800">Leg 2 · {hub} → {pod.split(" (")[0]}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export function RouteSelector() {
  const { pol, pod, mode, incoterm, transitTime, setRoute, setIncoterm, setIdentity, requestedDepartureDate, estimatedArrivalDate } = useQuoteStore();

  const handleUpdate = (field: "pol" | "pod" | "mode", value: string) => {
    const newPol = field === "pol" ? value : pol;
    const newPod = field === "pod" ? value : pod;
    const newMode = field === "mode" ? (value as TransportMode) : mode;
    setRoute(newPol, newPod, newMode);
  };

  const getTransportIcon = () => {
    switch (mode) {
      case "AIR": return <Plane className="h-4 w-4 text-amber-500" />;
      case "ROAD": return <Truck className="h-4 w-4 text-emerald-500" />;
      default: return <Ship className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <Card className="p-4 bg-white">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <div className="rounded-md border border-slate-200 bg-slate-100 p-1.5">{getTransportIcon()}</div>
          <span>Route &amp; Schedule</span>
        </div>
        <div className="flex items-center gap-1 rounded border border-slate-100 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-400">
          <MapIcon className="h-3 w-3" /> ATLAS GEO-LINK™
        </div>
      </div>

      <div className="grid gap-5">
        <WorldMap pol={pol} pod={pod} mode={mode} transitTime={transitTime} requestedDepartureDate={requestedDepartureDate} estimatedArrivalDate={estimatedArrivalDate} />
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Origin (POL)</Label>
            <div className="group relative">
              <Input list="ports" className="h-9 border-slate-200 bg-white pl-8 text-sm font-semibold uppercase text-slate-700 transition-all focus:border-blue-500" value={pol} onChange={(e) => handleUpdate("pol", e.target.value.toUpperCase())} />
              <Anchor className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 transition-colors group-hover:text-blue-500" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Destination (POD)</Label>
            <div className="group relative">
              <Input list="ports" className="h-9 border-slate-200 bg-white pl-8 text-sm font-semibold uppercase text-slate-700 transition-all focus:border-blue-500" value={pod} onChange={(e) => handleUpdate("pod", e.target.value.toUpperCase())} />
              <Anchor className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 transition-colors group-hover:text-blue-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Mode</Label>
            <Select value={mode} onValueChange={(val) => handleUpdate("mode", val)}>
              <SelectTrigger className="h-9 border-slate-200 bg-slate-50 font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEA_FCL">Sea FCL</SelectItem>
                <SelectItem value="SEA_LCL">Sea LCL</SelectItem>
                <SelectItem value="AIR">Air Freight</SelectItem>
                <SelectItem value="ROAD">Road Freight</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Incoterm</Label>
            <Select value={incoterm} onValueChange={(val) => setIncoterm(val as Incoterm)}>
              <SelectTrigger className="h-9 border-slate-200 bg-slate-50 font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXW">EXW - Ex Works</SelectItem>
                <SelectItem value="FOB">FOB - Free On Board</SelectItem>
                <SelectItem value="CFR">CFR - Cost &amp; Freight</SelectItem>
                <SelectItem value="CIF">CIF - Cost, Ins, Freight</SelectItem>
                <SelectItem value="DDP">DDP - Delivered Duty Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200/60 bg-slate-50/80 p-3">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-xs font-bold uppercase text-slate-700">Schedule Plan</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block text-[10px] text-slate-500">Req. Departure</Label>
              <Input type="date" className="h-7 border-slate-200 bg-white text-xs" value={requestedDepartureDate ?? ""} onChange={(e) => setIdentity("requestedDepartureDate", e.target.value)} />
            </div>
            <div className="border-l border-slate-200 pl-2">
              <Label className="mb-1 block text-[10px] text-slate-500">Est. Arrival (ETA)</Label>
              <Input type="date" className="h-7 border-slate-200 bg-white text-xs" value={estimatedArrivalDate ?? ""} onChange={(e) => setIdentity("estimatedArrivalDate", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-2">
          <div className="flex items-center gap-2 text-slate-500">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Transit Time</span>
          </div>
          <div className="flex items-center gap-2">
            <Input type="number" className="h-7 w-16 bg-slate-50 text-right text-xs font-mono" value={transitTime} onChange={(e) => setIdentity("transitTime", parseInt(e.target.value) || 0)} />
            <span className="text-xs text-slate-400">Days</span>
          </div>
        </div>

        <datalist id="ports">
          {Object.keys(PORT_GEO).map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </div>
    </Card>
  );
}
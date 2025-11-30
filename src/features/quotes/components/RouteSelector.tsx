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
  ArrowRight,
  MapPin,
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
  if (sea && isEUorNA(pol) && isSouthAmerica(pod)) return "ATLANTIC";
  if (sea && isSouthAmerica(pol) && isEUorNA(pod)) return "ATLANTIC";
  if (air && isEUorNA(pol) && isAsia(pod)) return "DXB HUB";
  if (air && isAsia(pol) && isEUorNA(pod)) return "DXB HUB";
  return null;
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
  
  const hub = inferHub(pol, pod, mode);
  const etaIso = estimatedArrivalDate || computeEtaFromTransit(requestedDepartureDate, transitTime);
  const effectiveTransit = transitTime || (etaIso && requestedDepartureDate ? Math.round((new Date(etaIso).getTime() - new Date(requestedDepartureDate).getTime()) / (1000 * 60 * 60 * 24)) : null);

  return (
    <div className="relative w-full h-64 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner group">
      {/* Background Gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_70%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.95),_transparent_65%)]" />
      
      {/* MAP SVG */}
      <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="darkenOverlay" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(15,23,42,0.6)" />
            <stop offset="100%" stopColor="rgba(15,23,42,0.9)" />
          </linearGradient>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={routeColor} stopOpacity="0" />
            <stop offset="35%" stopColor={routeColor} stopOpacity="0.8" />
            <stop offset="65%" stopColor={routeColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor={routeColor} stopOpacity="0" />
          </linearGradient>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Map Image */}
        <image x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} preserveAspectRatio="xMidYMid slice" xlinkHref={WORLD_MAP_URL} />
        <rect x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#darkenOverlay)" />
        
        {/* Subtle Grid Lines */}
        <g opacity={0.1}>
          {Array.from({ length: 13 }).map((_, i) => (
            <line key={`v-${i}`} x1={(MAP_WIDTH / 12) * i} y1={0} x2={(MAP_WIDTH / 12) * i} y2={MAP_HEIGHT} stroke="#cbd5e1" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 7 }).map((_, i) => (
            <line key={`h-${i}`} x1={0} y1={(MAP_HEIGHT / 6) * i} x2={MAP_WIDTH} y2={(MAP_HEIGHT / 6) * i} stroke="#cbd5e1" strokeWidth="0.5" />
          ))}
        </g>

        {/* Route Path */}
        <g filter="url(#softGlow)">
          <path d={pathD} fill="none" stroke="url(#routeGradient)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 8">
            <animate attributeName="stroke-dashoffset" from="28" to="0" dur="2.5s" repeatCount="indefinite" />
          </path>
          <circle r="3.5" fill="#f8fafc">
            <animateMotion dur="2.5s" repeatCount="indefinite" path={pathD} rotate="auto" />
          </circle>
          
          {/* POL Point & Label */}
          <g>
            <circle cx={start.x} cy={start.y} r="3" fill="#3b82f6" />
            <circle cx={start.x} cy={start.y} r="8" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.6">
              <animate attributeName="r" from="4" to="12" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.8" to="0" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* The identifier POL on the map */}
            <text x={start.x} y={start.y - 12} fontSize="11" fill="#fff" textAnchor="middle" fontWeight="bold" style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>POL</text>
          </g>

          {/* POD Point & Label */}
          <g>
            <circle cx={end.x} cy={end.y} r="3" fill="#22c55e" />
            <circle cx={end.x} cy={end.y} r="8" fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.6">
              <animate attributeName="r" from="4" to="12" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.8" to="0" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* The identifier POD on the map */}
            <text x={end.x} y={end.y + 18} fontSize="11" fill="#fff" textAnchor="middle" fontWeight="bold" style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>POD</text>
          </g>
        </g>
      </svg>

      {/* --- FLOATING UI LAYOUT --- */}
      
      {/* 1. Top Left: Origin Identifier */}
      <div className="pointer-events-none absolute top-4 left-4 flex flex-col gap-1 animate-in fade-in slide-in-from-left-2 duration-500">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Origin</span>
        <div className="flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-900/60 px-3 py-2 shadow-xl backdrop-blur-md">
          <Anchor className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-xs font-bold text-white tracking-wide">{pol || "SELECT POL"}</span>
        </div>
      </div>

      {/* 2. Top Right: Destination Identifier */}
      <div className="pointer-events-none absolute top-4 right-4 flex flex-col gap-1 items-end animate-in fade-in slide-in-from-right-2 duration-500">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pr-1">Destination</span>
        <div className="flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-900/60 px-3 py-2 shadow-xl backdrop-blur-md">
          <span className="text-xs font-bold text-white tracking-wide">{pod || "SELECT POD"}</span>
          <MapPin className="h-3.5 w-3.5 text-emerald-400" />
        </div>
      </div>

      {/* 3. Center Hub Info (Only if inferred) */}
      {hub && (
        <div className="pointer-events-none absolute top-6 left-1/2 -translate-x-1/2">
           <div className="flex items-center gap-1.5 rounded-full border border-slate-700/50 bg-slate-950/40 px-3 py-1 shadow-lg backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-[10px] font-medium text-slate-300 uppercase tracking-wide">Via {hub}</span>
           </div>
        </div>
      )}

      {/* 4. Bottom Right: Transit Time (The "Important Data") */}
      {effectiveTransit && (
        <div className="pointer-events-none absolute bottom-4 right-4 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
          <div className="flex flex-col items-end">
             <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2 shadow-2xl backdrop-blur-md">
                <div className="flex flex-col items-end">
                   <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">Transit Time</span>
                   <div className="flex items-baseline gap-1.5">
                      <span className="font-mono text-xl font-bold text-white tracking-tight leading-none">{effectiveTransit}</span>
                      <span className="text-[10px] font-medium text-slate-400">DAYS</span>
                   </div>
                </div>
                <div className="h-8 w-px bg-slate-700/50 mx-1"></div>
                <Clock className="h-5 w-5 text-blue-400" />
             </div>
          </div>
        </div>
      )}

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
    <Card className="p-4 bg-white h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <div className="rounded-md border border-slate-200 bg-slate-100 p-1.5">{getTransportIcon()}</div>
          <span>Route &amp; Schedule</span>
        </div>
        <div className="flex items-center gap-1 rounded border border-slate-100 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-400">
          <MapIcon className="h-3 w-3" /> ATLAS GEO-LINK™
        </div>
      </div>

      <div className="grid gap-5 flex-1">
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

        <div className="rounded-lg border border-slate-200/60 bg-slate-50/80 p-3 mt-auto">
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

        <datalist id="ports">
          {Object.keys(PORT_GEO).map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </div>
    </Card>
  );
}
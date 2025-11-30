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
  Map as MapIcon,
  MapPin,
  Container,
  AlertCircle
} from "lucide-react";
import { TransportMode, Incoterm } from "@/types/index";

// -----------------------------------------------------------------------------
// CONSTANTS & MAP
// -----------------------------------------------------------------------------

const MAP_WIDTH = 784.077;
const MAP_HEIGHT = 458.627;
const WORLD_MAP_URL = "/world-map-dark.svg";

type PortGeo = { lat: number; lon: number };

// Must match the datalist options exactly for the map to work
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

// EQUIPMENT LISTS
const EQUIP_SEA = ['20DV', '40DV', '40HC', '20RF', '40RF', '40OT', '20FR', '40FR'];
const EQUIP_ROAD = ['FTL Tilt Trailer', 'FTL Mega', 'FTL Box', 'FTL Reefer', 'LTL Groupage'];

const WorldMap = ({ pol, pod, mode, transitTime }: any) => {
  const start = getPortCoords(pol);
  const end = getPortCoords(pod);
  
  // Calculate quadratic bezier curve
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const arcHeight = mode === "AIR" ? dist * 0.35 : dist * 0.22;
  const cx = (start.x + end.x) / 2;
  const cy = Math.min(start.y, end.y) - arcHeight;
  const pathD = `M${start.x},${start.y} Q${cx},${cy} ${end.x},${end.y}`;
  const routeColor = mode === "AIR" ? "#fbbf24" : mode === "ROAD" ? "#22c55e" : "#3b82f6";
  
  return (
    <div className="relative w-full h-48 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner group mb-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_70%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.95),_transparent_65%)]" />
      <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="darkenOverlay" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(15,23,42,0.6)" />
            <stop offset="100%" stopColor="rgba(15,23,42,0.9)" />
          </linearGradient>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={routeColor} stopOpacity="0" />
            <stop offset="100%" stopColor={routeColor} stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <image x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} preserveAspectRatio="xMidYMid slice" xlinkHref={WORLD_MAP_URL} />
        <rect x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#darkenOverlay)" />
        
        {/* The Route Line */}
        <path d={pathD} fill="none" stroke="url(#routeGradient)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 8">
            <animate attributeName="stroke-dashoffset" from="28" to="0" dur="2.5s" repeatCount="indefinite" />
        </path>
        
        {/* Points */}
        <circle cx={start.x} cy={start.y} r="3" fill="#3b82f6" />
        <circle cx={end.x} cy={end.y} r="3" fill="#22c55e" />
      </svg>
      {transitTime > 0 && (
        <div className="absolute bottom-2 right-2 bg-slate-900/80 px-2 py-1 rounded border border-slate-700 text-white text-[10px] font-mono">
            {transitTime} DAYS
        </div>
      )}
    </div>
  );
};

export function RouteSelector() {
  const { 
      pol, pod, mode, incoterm, 
      placeOfLoading, placeOfDelivery,
      equipmentType, containerCount,
      transitTime, freeTime,
      totalWeight, totalVolume,
      setMode, setIncoterm, setRouteLocations, setEquipment, setIdentity,
      requestedDepartureDate, estimatedArrivalDate 
  } = useQuoteStore();

  // --- LOGIC HELPERS ---
  const isAir = mode === 'AIR';
  const isSeaFCL = mode === 'SEA_FCL';
  const isRoad = mode === 'ROAD';
  
  // Incoterm Logic
  const showPlaceOfLoading = incoterm === 'EXW';
  // DPU is the new DAT in 2020 rules
  const showPlaceOfDelivery = ['DAP', 'DPU', 'DDP'].includes(incoterm);
  
  // Label Logic
  const getOriginLabel = () => isAir ? "Airport of Departure (AOD)" : "Port of Loading (POL)";
  const getDestLabel = () => isAir ? "Airport of Destination (AOD)" : "Port of Discharge (POD)";
  const getPlacePlaceholder = () => isRoad ? "City, Zip Code" : "City / Port";

  // Filter Incoterms based on mode
  const getAvailableIncoterms = (): Incoterm[] => {
      // 2020 Rules: FAS, FOB, CFR, CIF are strictly Sea/Waterway
      if (isAir || isRoad) return ['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'] as any; 
      // Sea has access to all
      return ['EXW', 'FCA', 'FAS', 'FOB', 'CPT', 'CFR', 'CIF', 'CIP', 'DAP', 'DPU', 'DDP'];
  };

  const showEquipment = isSeaFCL || isRoad;
  const showContainerCount = isSeaFCL;
  // BUSINESS RULE: LCL does not usually have detention free time (it's storage)
  const showFreeTime = isSeaFCL; 

  const handleLocationChange = (field: 'pol' | 'pod', value: string) => {
      // This ensures we always pass uppercase to match map keys
      setRouteLocations(field, value.toUpperCase());
  }

  return (
    <Card className="p-4 bg-white h-full flex flex-col overflow-y-auto">
      
      {/* 1. Header & Map */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <div className="rounded-md border border-slate-200 bg-slate-100 p-1.5">
             {isAir ? <Plane className="h-4 w-4 text-amber-500" /> : isRoad ? <Truck className="h-4 w-4 text-emerald-500" /> : <Ship className="h-4 w-4 text-blue-600" />}
          </div>
          <span className="text-sm">Route & Schedule</span>
        </div>
        <div className="flex items-center gap-1 rounded border border-slate-100 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-400">
          <MapIcon className="h-3 w-3" /> GEO-LINK™
        </div>
      </div>

      <WorldMap pol={pol} pod={pod} mode={mode} transitTime={transitTime} />

      {/* 2. LEVEL 1: MODE & INCOTERM (The Drivers) */}
      <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-slate-500 uppercase">Transport Mode</Label>
            <Select value={mode} onValueChange={(val) => setMode(val as TransportMode)}>
              <SelectTrigger className="h-8 border-slate-200 bg-white font-bold text-xs shadow-sm">
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
            <Label className="text-[10px] font-bold text-slate-500 uppercase">Incoterm (2020)</Label>
            <Select value={incoterm} onValueChange={(val) => setIncoterm(val as Incoterm)}>
              <SelectTrigger className="h-8 border-slate-200 bg-white font-bold text-xs shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getAvailableIncoterms().map(i => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
      </div>

      {/* 3. LEVEL 2: LOCATIONS (Dynamic) */}
      <div className="space-y-3 mb-4">
          
          {/* Conditional: Place of Loading (EXW) */}
          {showPlaceOfLoading && (
              <div className="space-y-1 animate-in slide-in-from-top-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">Pickup Address (Factory)</Label>
                  <div className="relative">
                      <Input className="h-8 bg-amber-50/50 border-amber-200 text-xs pl-7" placeholder="City, Zip, Street" 
                          value={placeOfLoading} onChange={(e) => setRouteLocations('placeOfLoading', e.target.value)} 
                      />
                      <MapPin className="absolute left-2 top-2 h-4 w-4 text-amber-500" />
                  </div>
              </div>
          )}

          {/* Standard POL/POD */}
          <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">{getOriginLabel()}</Label>
                  <div className="group relative">
                    <Input 
                        list="ports"
                        className="h-8 text-xs font-semibold uppercase" 
                        placeholder={getPlacePlaceholder()} 
                        value={pol} 
                        onChange={(e) => handleLocationChange('pol', e.target.value)}
                    />
                    <MapPin className="absolute left-2.5 top-2.5 h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
              </div>
              <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">{getDestLabel()}</Label>
                  <div className="group relative">
                    <Input 
                        list="ports"
                        className="h-8 text-xs font-semibold uppercase" 
                        placeholder={getPlacePlaceholder()} 
                        value={pod} 
                        onChange={(e) => handleLocationChange('pod', e.target.value)}
                    />
                    <MapPin className="absolute left-2.5 top-2.5 h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
              </div>
          </div>

          {/* Conditional: Place of Delivery (DAP/DPU/DDP) */}
          {showPlaceOfDelivery && (
              <div className="space-y-1 animate-in slide-in-from-bottom-2">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">Final Delivery Address</Label>
                  <div className="relative">
                      <Input className="h-8 bg-blue-50/50 border-blue-200 text-xs pl-7" placeholder="City, Zip, Street" 
                          value={placeOfDelivery} onChange={(e) => setRouteLocations('placeOfDelivery', e.target.value)}
                      />
                      <MapPin className="absolute left-2 top-2 h-4 w-4 text-blue-500" />
                  </div>
              </div>
          )}
      </div>

      {/* 4. LEVEL 3: LOGISTICS DETAILS (Grid) */}
      <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Equipment Selector */}
          {showEquipment && (
              <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">Equipment</Label>
                  <Select value={equipmentType} onValueChange={(val) => setEquipment(val, containerCount)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select Type" /></SelectTrigger>
                      <SelectContent>
                          {(isRoad ? EQUIP_ROAD : EQUIP_SEA).map(eq => <SelectItem key={eq} value={eq}>{eq}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
          )}

          {/* Container Count */}
          {showContainerCount && (
              <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">Units</Label>
                  <div className="relative">
                      <Input type="number" min={1} className="h-8 text-xs pl-7" 
                          value={containerCount} onChange={(e) => setEquipment(equipmentType, parseInt(e.target.value))}
                      />
                      <Container className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400" />
                  </div>
              </div>
          )}

          {/* Franchise */}
          {showFreeTime && (
              <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">Free Time</Label>
                  <div className="flex items-center gap-1">
                      <Input type="number" className="h-8 text-xs" placeholder="0" 
                          value={freeTime} onChange={(e) => setIdentity('freeTime', parseInt(e.target.value))}
                      />
                      <span className="text-[10px] text-slate-400 font-medium">Days</span>
                  </div>
              </div>
          )}

          {/* Transit Time (Always Visible) */}
          <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-500 uppercase">Est. Transit</Label>
              <div className="flex items-center gap-1">
                  <Input type="number" className="h-8 text-xs" placeholder="0" 
                      value={transitTime} onChange={(e) => setIdentity('transitTime', parseInt(e.target.value))}
                  />
                  <span className="text-[10px] text-slate-400 font-medium">Days</span>
              </div>
          </div>
      </div>

      {/* 5. VALIDATION WARNING */}
      {isAir && (totalWeight === 0 || totalVolume === 0) && (
          <div className="mt-auto p-2 bg-red-50 border border-red-100 rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-[10px] text-red-600 font-medium">Air Freight requires valid Weight & Volume.</span>
          </div>
      )}

      {/* 6. DATES FOOTER */}
      <div className="mt-auto pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
        <div>
            <Label className="text-[9px] text-slate-400 mb-1 block">Requested Dep.</Label>
            <Input type="date" className="h-7 text-[10px]" value={requestedDepartureDate || ''} onChange={(e) => setIdentity('requestedDepartureDate', e.target.value)} />
        </div>
        <div>
            <Label className="text-[9px] text-slate-400 mb-1 block">Est. Arrival</Label>
            <Input type="date" className="h-7 text-[10px]" value={estimatedArrivalDate || ''} onChange={(e) => setIdentity('estimatedArrivalDate', e.target.value)} />
        </div>
      </div>

      {/* FIXED: Datalist for Map Coordination */}
      <datalist id="ports">
          {Object.keys(PORT_GEO).map((p) => (
            <option key={p} value={p} />
          ))}
      </datalist>

    </Card>
  );
}
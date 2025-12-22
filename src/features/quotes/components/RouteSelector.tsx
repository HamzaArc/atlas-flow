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
  Plane, Ship, Truck, Map as MapIcon, MapPin, Container, Clock, Calendar, Anchor
} from "lucide-react";
import { TransportMode, Incoterm } from "@/types/index";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// -----------------------------------------------------------------------------
// CONSTANTS & MAP (Kept simplified for brevity, logic remains identical)
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

// EQUIPMENT LISTS
const EQUIP_SEA = ['20DV', '40DV', '40HC', '20RF', '40RF', '40OT', '20FR', '40FR'];
const EQUIP_ROAD = ['FTL Tilt Trailer', 'FTL Mega', 'FTL Box', 'FTL Reefer', 'LTL Groupage'];

const WorldMap = ({ pol, pod, mode, transitTime }: any) => {
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
  
  const polName = pol.split('(')[0].trim().substring(0, 15);
  const podName = pod.split('(')[0].trim().substring(0, 15);
  const polCode = pol.match(/\((.*?)\)/)?.[1] || "ORIGIN";
  const podCode = pod.match(/\((.*?)\)/)?.[1] || "DEST";

  return (
    <div className="relative w-full h-48 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner group shrink-0">
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
        <path d={pathD} fill="none" stroke="url(#routeGradient)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 8">
            <animate attributeName="stroke-dashoffset" from="28" to="0" dur="2.5s" repeatCount="indefinite" />
        </path>
        <circle cx={start.x} cy={start.y} r="3" fill="#3b82f6" />
        <circle cx={end.x} cy={end.y} r="3" fill="#22c55e" />
      </svg>

      {/* HUD OVERLAY */}
      <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
          <div className="flex flex-col items-start bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-lg px-3 py-2 shadow-2xl">
              <span className="text-[9px] text-slate-400 font-bold tracking-wider mb-0.5">POL</span>
              <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black text-white tracking-tight leading-none">{polCode}</span>
                  <span className="text-[10px] text-slate-400 font-medium truncate max-w-[80px] border-l border-slate-700 pl-2">{polName}</span>
              </div>
          </div>

          <div className="mt-2 flex items-center justify-center w-8 h-8 rounded-full bg-slate-800/90 border border-slate-600 shadow-xl backdrop-blur-sm">
             {mode === 'AIR' ? <Plane className="h-4 w-4 text-amber-400" /> : mode === 'ROAD' ? <Truck className="h-4 w-4 text-emerald-400" /> : <Ship className="h-4 w-4 text-blue-400" />}
          </div>

          <div className="flex flex-col items-end bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-lg px-3 py-2 shadow-2xl">
              <span className="text-[9px] text-slate-400 font-bold tracking-wider mb-0.5 text-right">POD</span>
              <div className="flex flex-row-reverse items-baseline gap-2">
                  <span className="text-lg font-black text-white tracking-tight leading-none">{podCode}</span>
                  <span className="text-[10px] text-slate-400 font-medium truncate max-w-[80px] border-r border-slate-700 pr-2">{podName}</span>
              </div>
          </div>
      </div>

      {transitTime > 0 && (
        <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-emerald-950/80 backdrop-blur-md px-2.5 py-1 rounded border border-emerald-500/30 text-emerald-400 shadow-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold font-mono tracking-wide">{transitTime} DAYS</span>
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

  const isAir = mode === 'AIR';
  const isSeaFCL = mode === 'SEA_FCL';
  const isSeaLCL = mode === 'SEA_LCL';
  const isRoad = mode === 'ROAD';
  
  const showPlaceOfLoading = incoterm === 'EXW';
  const showPlaceOfDelivery = ['DAP', 'DPU', 'DDP'].includes(incoterm);
  
  const getOriginLabel = () => isAir ? "Airport of Departure" : "Port of Loading";
  const getDestLabel = () => isAir ? "Airport of Destination" : "Port of Discharge";
  const getPlacePlaceholder = () => isRoad ? "City, Zip Code" : "City / Port";

  const getAvailableIncoterms = (): Incoterm[] => {
      if (isAir || isRoad) return ['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'] as any; 
      return ['EXW', 'FCA', 'FAS', 'FOB', 'CPT', 'CFR', 'CIF', 'CIP', 'DAP', 'DPU', 'DDP'];
  };

  const showEquipment = isSeaFCL || isRoad;
  const showContainerCount = isSeaFCL;
  const showFreeTime = isSeaFCL || isSeaLCL; 

  const handleLocationChange = (field: 'pol' | 'pod', value: string) => {
      setRouteLocations(field, value.toUpperCase());
  }

  // --- UPDATED: Main div instead of Card with border-none ---
  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      
      {/* 1. Header (Built-in) */}
      <div className="px-5 py-3 border-b border-slate-100 shrink-0 bg-white">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-700">
                <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
                    <MapIcon className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs uppercase tracking-wider">Route & Schedule</span>
            </div>
            <Badge variant="outline" className="text-[9px] h-5 bg-white text-slate-500 border-slate-200">
                GEO-LINK™
            </Badge>
        </div>
      </div>

      {/* 2. Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Map Visualization */}
          <WorldMap pol={pol} pod={pod} mode={mode} transitTime={transitTime} />

          {/* Configuration Group */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 space-y-4">
              
              {/* LEVEL 1: MODE & INCOTERM */}
              <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transport Mode</Label>
                    <Select value={mode} onValueChange={(val) => setMode(val as TransportMode)}>
                      <SelectTrigger className="h-9 border-slate-200 bg-white font-semibold text-xs shadow-sm hover:border-blue-300 transition-colors">
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
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Incoterm (2020)</Label>
                    <Select value={incoterm} onValueChange={(val) => setIncoterm(val as Incoterm)}>
                      <SelectTrigger className="h-9 border-slate-200 bg-white font-semibold text-xs shadow-sm hover:border-blue-300 transition-colors">
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

              {/* LEVEL 2: LOCATIONS */}
              <div className="space-y-4">
                  {showPlaceOfLoading && (
                      <div className="space-y-1 animate-in slide-in-from-top-1 fade-in duration-300">
                          <Label className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Pickup Address</Label>
                          <div className="relative group">
                              <Input className="h-9 bg-white border-amber-200 text-xs pl-9 focus:border-amber-400 transition-all shadow-sm" placeholder="Factory Address" 
                                  value={placeOfLoading} onChange={(e) => setRouteLocations('placeOfLoading', e.target.value)} 
                              />
                              <Truck className="absolute left-3 top-2.5 h-4 w-4 text-amber-500" />
                          </div>
                      </div>
                  )}

                  <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{getOriginLabel()}</Label>
                          <div className="relative group">
                            <Input 
                                list="ports"
                                className="h-9 text-xs font-bold uppercase bg-white border-slate-200 pl-9 focus:ring-blue-100 transition-all shadow-sm" 
                                placeholder={getPlacePlaceholder()} 
                                value={pol} 
                                onChange={(e) => handleLocationChange('pol', e.target.value)}
                            />
                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                          </div>
                      </div>
                      <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{getDestLabel()}</Label>
                          <div className="relative group">
                            <Input 
                                list="ports"
                                className="h-9 text-xs font-bold uppercase bg-white border-slate-200 pl-9 focus:ring-blue-100 transition-all shadow-sm" 
                                placeholder={getPlacePlaceholder()} 
                                value={pod} 
                                onChange={(e) => handleLocationChange('pod', e.target.value)}
                            />
                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                          </div>
                      </div>
                  </div>

                  {showPlaceOfDelivery && (
                      <div className="space-y-1 animate-in slide-in-from-bottom-1 fade-in duration-300">
                          <Label className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Final Delivery Address</Label>
                          <div className="relative group">
                              <Input className="h-9 bg-white border-blue-200 text-xs pl-9 focus:border-blue-400 transition-all shadow-sm" placeholder="Warehouse Address" 
                                  value={placeOfDelivery} onChange={(e) => setRouteLocations('placeOfDelivery', e.target.value)}
                              />
                              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-blue-500" />
                          </div>
                      </div>
                  )}
              </div>
          </div>

          {/* LEVEL 3: LOGISTICS DETAILS */}
          <div className="grid grid-cols-2 gap-5">
              {showEquipment && (
                  <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Equipment</Label>
                      <Select value={equipmentType} onValueChange={(val) => setEquipment(val, containerCount)}>
                          <SelectTrigger className="h-8 text-xs bg-slate-50 border-transparent hover:bg-white hover:border-slate-200 transition-all"><SelectValue placeholder="Select Type" /></SelectTrigger>
                          <SelectContent>
                              {(isRoad ? EQUIP_ROAD : EQUIP_SEA).map(eq => <SelectItem key={eq} value={eq}>{eq}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
              )}

              {showContainerCount && (
                  <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Units</Label>
                      <div className="relative">
                          <Input type="number" min={1} className="h-8 text-xs pl-8 bg-slate-50 border-transparent hover:bg-white hover:border-slate-200 transition-all" 
                              value={containerCount} onChange={(e) => setEquipment(equipmentType, parseInt(e.target.value))}
                          />
                          <Container className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
                      </div>
                  </div>
              )}

              {showFreeTime && (
                  <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Free Time</Label>
                      <div className="relative">
                          <Input type="number" className="h-8 text-xs pl-8 bg-slate-50 border-transparent hover:bg-white hover:border-slate-200 transition-all" placeholder="0" 
                              value={freeTime} onChange={(e) => setIdentity('freeTime', parseInt(e.target.value))}
                          />
                          <Anchor className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
                          <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-medium">Days</span>
                      </div>
                  </div>
              )}

              {/* Transit Time (Always Visible) */}
              <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Est. Transit</Label>
                  <div className="relative">
                      <Input type="number" className="h-8 text-xs pl-8 bg-slate-50 border-transparent hover:bg-white hover:border-slate-200 transition-all" placeholder="0" 
                          value={transitTime} onChange={(e) => setIdentity('transitTime', parseInt(e.target.value))}
                      />
                      <Clock className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
                      <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-medium">Days</span>
                  </div>
              </div>
          </div>

          {/* Validation Warning */}
          {isAir && (totalWeight === 0 || totalVolume === 0) && (
              <div className="p-2 bg-red-50 border border-red-100 rounded-md flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-500" />
                  <span className="text-[10px] text-red-600 font-medium">Air Freight requires valid Weight & Volume.</span>
              </div>
          )}
      </div>

      {/* 4. Dates Footer */}
      <div className="mt-auto px-5 py-3 border-t border-slate-100 bg-slate-50/50 grid grid-cols-2 gap-5 shrink-0">
        <div className="space-y-1">
            <Label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Requested Dep.</Label>
            <div className="relative">
                <Input type="date" className="h-7 text-[10px] pl-7 bg-white border-slate-200" value={requestedDepartureDate || ''} onChange={(e) => setIdentity('requestedDepartureDate', e.target.value)} />
                <Calendar className="absolute left-2 top-1.5 h-3.5 w-3.5 text-slate-400" />
            </div>
        </div>
        <div className="space-y-1">
            <Label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Est. Arrival</Label>
            <div className="relative">
                <Input type="date" className="h-7 text-[10px] pl-7 bg-white border-slate-200" value={estimatedArrivalDate || ''} onChange={(e) => setIdentity('estimatedArrivalDate', e.target.value)} />
                <Calendar className="absolute left-2 top-1.5 h-3.5 w-3.5 text-slate-400" />
            </div>
        </div>
      </div>

      <datalist id="ports">
          {Object.keys(PORT_GEO).map((p) => (
            <option key={p} value={p} />
          ))}
      </datalist>

    </div>
  );
}
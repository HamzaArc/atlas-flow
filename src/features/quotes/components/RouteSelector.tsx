import { useState, useMemo } from "react";
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
  Plane, Ship, Truck, Map as MapIcon, MapPin, Container, Clock, Calendar, Anchor,
  Leaf, ShieldCheck, Check, ChevronsUpDown, Search, Info
} from "lucide-react";
import { TransportMode, Incoterm } from "@/types/index";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// -----------------------------------------------------------------------------
// CONSTANTS & MAP DATA
// -----------------------------------------------------------------------------

const MAP_WIDTH = 784.077;
const MAP_HEIGHT = 458.627;
const WORLD_MAP_URL = "/world-map-dark.svg";

// Extended Port Data with Real Geo for Math & Display Metadata
type PortData = { 
  id: string; 
  mapLat: number; 
  mapLon: number; 
  realLat: number; 
  realLon: number;
  country: string;
  code: string;
  tier?: boolean;
};

const PORT_DB: PortData[] = [
  { id: "CASABLANCA (MAP)", mapLat: 8.0, mapLon: -16.0, realLat: 33.57, realLon: -7.58, country: "Morocco", code: "MACAS" },
  { id: "TANGER MED (MAP)", mapLat: 10.3, mapLon: -13.9, realLat: 35.88, realLon: -5.54, country: "Morocco", code: "MAPTM", tier: true },
  { id: "AGADIR (MAP)", mapLat: 4.8, mapLon: -18.0, realLat: 30.42, realLon: -9.60, country: "Morocco", code: "MAAGA" },
  { id: "ROTTERDAM (NL)", mapLat: 26.3, mapLon: -3.9, realLat: 51.92, realLon: 4.40, country: "Netherlands", code: "NLRTM", tier: true },
  { id: "HAMBURG (DE)", mapLat: 27.9, mapLon: 1.6, realLat: 53.55, realLon: 9.99, country: "Germany", code: "DEHAM" },
  { id: "VALENCIA (ES)", mapLat: 13.9, mapLon: -8.8, realLat: 39.46, realLon: -0.37, country: "Spain", code: "ESVLC" },
  { id: "MARSEILLE (FR)", mapLat: 17.7, mapLon: -3.0, realLat: 43.29, realLon: 5.36, country: "France", code: "FRMRS" },
  { id: "SHANGHAI (CN)", mapLat: 5.6, mapLon: 113.1, realLat: 31.23, realLon: 121.47, country: "China", code: "CNSHA", tier: true },
  { id: "NINGBO (CN)", mapLat: 4.3, mapLon: 113.2, realLat: 29.86, realLon: 121.54, country: "China", code: "CNNGB" },
  { id: "DUBAI (AE)", mapLat: -0.3, mapLon: 46.9, realLat: 25.20, realLon: 55.27, country: "UAE", code: "AEDXB", tier: true },
  { id: "SINGAPORE (SG)", mapLat: -24.25, mapLon: 95.4, realLat: 1.35, realLon: 103.81, country: "Singapore", code: "SGSIN", tier: true },
  { id: "NEW YORK (US)", mapLat: 15.1, mapLon: -82.4, realLat: 40.71, realLon: -74.00, country: "USA", code: "USNYC", tier: true },
  { id: "LOS ANGELES (US)", mapLat: 8.4, mapLon: -126.6, realLat: 34.05, realLon: -118.24, country: "USA", code: "USLAX" },
  { id: "SANTOS (BR)", mapLat: -49.55, mapLon: -54.73, realLat: -23.96, realLon: -46.33, country: "Brazil", code: "BRSSZ" },
];

function project(lat: number, lon: number) {
  const x = ((lon + 180) / 360) * MAP_WIDTH;
  const y = ((90 - lat) / 180) * MAP_HEIGHT;
  return { x, y };
}

function getPortData(id: string) {
  return PORT_DB.find(p => p.id === id) || PORT_DB[0];
}

// Haversine Formula for distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

// -----------------------------------------------------------------------------
// SUB-COMPONENT: INCOTERM RULER
// -----------------------------------------------------------------------------

const INCOTERM_RISK: Record<string, { seller: number; buyer: number; label: string }> = {
  EXW: { seller: 0, buyer: 100, label: "Buyer bears all costs & risks" },
  FCA: { seller: 15, buyer: 85, label: "Seller loads goods, Buyer takes over" },
  FAS: { seller: 20, buyer: 80, label: "Seller alongside ship" },
  FOB: { seller: 30, buyer: 70, label: "Seller loads on vessel" },
  CFR: { seller: 50, buyer: 50, label: "Seller pays freight, Buyer pays insurance" },
  CIF: { seller: 50, buyer: 50, label: "Seller pays freight & insurance" },
  CPT: { seller: 45, buyer: 55, label: "Seller pays carriage to destination" },
  CIP: { seller: 55, buyer: 45, label: "Seller pays carriage & insurance" },
  DAP: { seller: 80, buyer: 20, label: "Seller delivers to place" },
  DPU: { seller: 90, buyer: 10, label: "Seller delivers & unloads" },
  DDP: { seller: 100, buyer: 0, label: "Seller bears all costs & risks" },
};

const IncotermResponsibilityRuler = ({ incoterm }: { incoterm: string }) => {
  const data = INCOTERM_RISK[incoterm] || { seller: 50, buyer: 50, label: "Standard Terms" };
  
  return (
    <div className="mt-2 space-y-1.5 animate-in fade-in duration-500">
      <div className="flex justify-between text-[10px] font-semibold text-slate-500 uppercase tracking-tight">
        <span className="text-emerald-600 flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Seller Risk</span>
        <span className="text-blue-600">Buyer Risk</span>
      </div>
      <div className="relative h-2.5 w-full bg-blue-100 rounded-full overflow-hidden flex">
        <div 
          className="h-full bg-emerald-500 transition-all duration-700 ease-out flex items-center justify-end pr-1"
          style={{ width: `${data.seller}%` }}
        >
          {data.seller > 10 && <div className="h-1.5 w-0.5 bg-white/30 rounded-full" />}
        </div>
      </div>
      <div className="flex justify-between items-center">
        <p className="text-[10px] text-slate-400 font-medium italic">{data.label}</p>
        <span className="text-[9px] font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
          {data.seller}/{data.buyer}
        </span>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// SUB-COMPONENT: SMART PORT SEARCH (Combobox)
// -----------------------------------------------------------------------------

const SmartPortSelector = ({ 
  value, 
  onChange, 
  label, 
  icon: Icon 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  label: string;
  icon: any;
}) => {
  const [open, setOpen] = useState(false);
  const selectedPort = PORT_DB.find(p => p.id === value);

  return (
    <div className="space-y-1">
      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-9 text-xs font-bold border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-all"
          >
            <div className="flex items-center gap-2 truncate">
              <Icon className={cn("h-4 w-4", selectedPort ? "text-blue-600" : "text-slate-400")} />
              {selectedPort ? (
                <span className="uppercase">{selectedPort.id.split('(')[0]} <span className="text-slate-400 font-normal">({selectedPort.code})</span></span>
              ) : (
                <span className="text-slate-400 font-normal">Select Location...</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search port name or code..." className="h-9 text-xs" />
            <CommandList>
              <CommandEmpty>No port found.</CommandEmpty>
              <CommandGroup heading="Global Hubs">
                {PORT_DB.map((port) => (
                  <CommandItem
                    key={port.id}
                    // FIXED: Replaced port.name with port.id since name doesn't exist
                    value={`${port.id} ${port.code}`}
                    onSelect={() => {
                      onChange(port.id);
                      setOpen(false);
                    }}
                    className="text-xs py-2"
                  >
                    <div className="flex items-center w-full gap-2">
                      <div className={cn("w-1 h-8 rounded-full", port.tier ? "bg-blue-500" : "bg-slate-300")} />
                      <div className="flex flex-col">
                        {/* FIXED: Replaced port.name with port.id */}
                        <span className="font-bold text-slate-700">{port.id}</span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          {port.country} • <span className="font-mono text-blue-500">{port.code}</span>
                        </span>
                      </div>
                      {value === port.id && <Check className="ml-auto h-3 w-3 text-blue-600" />}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// -----------------------------------------------------------------------------
// SUB-COMPONENT: INTELLIGENT WORLD MAP
// -----------------------------------------------------------------------------

const WorldMap = ({ pol, pod, mode, transitTime, totalWeight }: any) => {
  // Get Coordinate Data
  const polData = getPortData(pol);
  const podData = getPortData(pod);

  // Projection for Visualization
  const start = project(polData.mapLat, polData.mapLon);
  const end = project(podData.mapLat, podData.mapLon);
  
  // Real Distance Calc
  const realDistanceKm = calculateDistance(polData.realLat, polData.realLon, podData.realLat, podData.realLon);
  
  // Sustainability Calc
  // Factors (kg CO2e per ton-km) - Mock Averages
  const co2Factor = mode === "AIR" ? 0.602 : mode === "ROAD" ? 0.062 : 0.012; 
  const weightTons = totalWeight > 0 ? totalWeight / 1000 : 1; // Default to 1 ton if 0
  const carbonFootprint = (realDistanceKm * weightTons * co2Factor).toFixed(2);

  // Visuals
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const arcHeight = mode === "AIR" ? dist * 0.35 : dist * 0.22;
  const cx = (start.x + end.x) / 2;
  const cy = Math.min(start.y, end.y) - arcHeight;
  const pathD = `M${start.x},${start.y} Q${cx},${cy} ${end.x},${end.y}`;
  const routeColor = mode === "AIR" ? "#fbbf24" : mode === "ROAD" ? "#22c55e" : "#3b82f6";
  
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

      {/* HUD OVERLAY: LOCATIONS */}
      <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
          <div className="flex flex-col items-start bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-lg px-3 py-2 shadow-2xl">
              <span className="text-[9px] text-slate-400 font-bold tracking-wider mb-0.5">ORIGIN</span>
              <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black text-white tracking-tight leading-none">{polData.code}</span>
                  <span className="text-[10px] text-slate-400 font-medium truncate max-w-[80px] border-l border-slate-700 pl-2">{polData.id.split('(')[0]}</span>
              </div>
          </div>

          {/* Mode Icon Center */}
          <div className="mt-2 flex items-center justify-center w-8 h-8 rounded-full bg-slate-800/90 border border-slate-600 shadow-xl backdrop-blur-sm">
             {mode === 'AIR' ? <Plane className="h-4 w-4 text-amber-400" /> : mode === 'ROAD' ? <Truck className="h-4 w-4 text-emerald-400" /> : <Ship className="h-4 w-4 text-blue-400" />}
          </div>

          <div className="flex flex-col items-end bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-lg px-3 py-2 shadow-2xl">
              <span className="text-[9px] text-slate-400 font-bold tracking-wider mb-0.5 text-right">DEST</span>
              <div className="flex flex-row-reverse items-baseline gap-2">
                  <span className="text-lg font-black text-white tracking-tight leading-none">{podData.code}</span>
                  <span className="text-[10px] text-slate-400 font-medium truncate max-w-[80px] border-r border-slate-700 pr-2">{podData.id.split('(')[0]}</span>
              </div>
          </div>
      </div>

      {/* HUD OVERLAY: STATS (Sustainability & Time) */}
      <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-none">
        {/* Eco Badge */}
        <div className="flex items-center gap-2 bg-emerald-950/80 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-emerald-500/30 shadow-lg">
           <Leaf className="h-3 w-3 text-emerald-400" />
           <div className="flex flex-col leading-none">
             <span className="text-[9px] text-emerald-300 font-medium">{realDistanceKm.toLocaleString()} km</span>
             <span className="text-[8px] text-emerald-500/80 font-mono">~{carbonFootprint}t CO2e</span>
           </div>
        </div>

        {/* Transit Badge */}
        {transitTime > 0 && (
          <div className="flex items-center gap-2 bg-blue-950/80 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-blue-500/30 shadow-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
              <span className="text-[10px] font-bold font-mono tracking-wide text-blue-100">{transitTime} DAYS</span>
          </div>
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------------------------------

export function RouteSelector() {
  const { 
      pol, pod, mode, incoterm, 
      placeOfLoading, placeOfDelivery,
      equipmentType, containerCount,
      transitTime, freeTime,
      totalWeight, totalVolume,
      setMode, setIncoterm, setRouteLocations, setEquipment, setIdentity, setLogisticsParam,
      requestedDepartureDate, estimatedArrivalDate 
  } = useQuoteStore();

  const isAir = mode === 'AIR';
  const isSeaFCL = mode === 'SEA_FCL';
  const isSeaLCL = mode === 'SEA_LCL';
  const isRoad = mode === 'ROAD';
  
  const showPlaceOfLoading = incoterm === 'EXW';
  const showPlaceOfDelivery = ['DAP', 'DPU', 'DDP'].includes(incoterm);
  
  const getAvailableIncoterms = (): Incoterm[] => {
      if (isAir || isRoad) return ['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'] as any; 
      return ['EXW', 'FCA', 'FAS', 'FOB', 'CPT', 'CFR', 'CIF', 'CIP', 'DAP', 'DPU', 'DDP'];
  };

  const showEquipment = isSeaFCL || isRoad;
  const showContainerCount = isSeaFCL;
  const showFreeTime = isSeaFCL || isSeaLCL; 
  const EQUIP_SEA = ['20DV', '40DV', '40HC', '20RF', '40RF', '40OT', '20FR', '40FR'];
  const EQUIP_ROAD = ['FTL Tilt Trailer', 'FTL Mega', 'FTL Box', 'FTL Reefer', 'LTL Groupage'];

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      
      {/* 1. Header */}
      <div className="px-5 py-3 border-b border-slate-100 shrink-0 bg-white">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-700">
                <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
                    <MapIcon className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs uppercase tracking-wider">Logistics Command</span>
            </div>
            <Badge variant="outline" className="text-[9px] h-5 bg-white text-slate-500 border-slate-200">
                ATLAS INTELLIGENCE™
            </Badge>
        </div>
      </div>

      {/* 2. Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Feature: Intelligent Map */}
          <WorldMap pol={pol} pod={pod} mode={mode} transitTime={transitTime} totalWeight={totalWeight} />

          {/* Configuration Group */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 space-y-5">
              
              {/* LEVEL 1: MODE & INCOTERM + RULER */}
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
              
              {/* Feature: Compliance Visualizer */}
              <div className="px-1">
                 <IncotermResponsibilityRuler incoterm={incoterm} />
              </div>

              {/* LEVEL 2: SMART PORT SELECTORS */}
              <div className="space-y-4 pt-2 border-t border-slate-200 border-dashed">
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
                      <SmartPortSelector 
                        label={isAir ? "Airport of Departure" : "Port of Loading"}
                        value={pol}
                        onChange={(val) => setRouteLocations('pol', val)}
                        icon={MapPin}
                      />
                      <SmartPortSelector 
                        label={isAir ? "Airport of Destination" : "Port of Discharge"}
                        value={pod}
                        onChange={(val) => setRouteLocations('pod', val)}
                        icon={Anchor}
                      />
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
                              value={freeTime} onChange={(e) => setLogisticsParam('freeTime', parseInt(e.target.value) || 0)} 
                          />
                          <Clock className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
                          <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-medium">Days</span>
                      </div>
                  </div>
              )}

              {/* Transit Time (Editable) */}
              <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Est. Transit</Label>
                  <div className="relative">
                      <Input type="number" className="h-8 text-xs pl-8 bg-slate-50 border-transparent hover:bg-white hover:border-slate-200 transition-all" placeholder="0" 
                          value={transitTime} onChange={(e) => setLogisticsParam('transitTime', parseInt(e.target.value) || 0)} 
                      />
                      <Clock className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
                      <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-medium">Days</span>
                  </div>
              </div>
          </div>

          {/* Validation Warning */}
          {isAir && (totalWeight === 0 || totalVolume === 0) && (
              <div className="p-2 bg-red-50 border border-red-100 rounded-md flex items-center gap-2">
                  <Info className="h-4 w-4 text-red-500" />
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
    </div>
  );
}
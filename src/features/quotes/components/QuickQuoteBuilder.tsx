import { useEffect, useState, useRef } from "react";
import { 
   MapPin, Package, Container, 
  Plane,  Truck, ArrowRight, 
  Wand2, Calendar, 
  Box,  
  Plus, Trash2, Clock, Anchor,
  Mail, Copy, FileOutput, Zap, DollarSign, X, AlertCircle,
  Loader2, AlertTriangle, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { SmartPortSelector } from "./RouteSelector";
import { useQuoteStore } from "@/store/useQuoteStore";
import { useClientStore } from "@/store/useClientStore"; 
import { useTariffStore } from "@/store/useTariffStore";
import { cn } from "@/lib/utils";
import { TransportMode, Incoterm, PackagingType, Currency } from "@/types/index";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

// -----------------------------------------------------------------------------
// GOOGLE MAPS & ADDRESS UTILS (Ported from RouteSelector)
// -----------------------------------------------------------------------------

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""; 

const GOOGLE_MAP_STYLES = [
  { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
  { "featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#181818" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "featureType": "poi.park", "elementType": "labels.text.stroke", "stylers": [{ "color": "#1b1b1b" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#8a8a8a" }] },
  { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#373737" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#3c3c3c" }] },
  { "featureType": "road.highway.controlled_access", "elementType": "geometry", "stylers": [{ "color": "#4e4e4e" }] },
  { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "featureType": "transit", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#3d3d3d" }] }
];

const useGoogleMaps = (apiKey: string) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }
    if (!apiKey) return;
    
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => setIsLoaded(true));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.body.appendChild(script);
  }, [apiKey]);

  return isLoaded;
};

const AddressWithMap = ({ 
  label, 
  value, 
  onChange, 
  disabled, 
  iconClassName,
  placeholder 
}: { 
  label: string, 
  value: string, 
  onChange: (val: string) => void, 
  disabled?: boolean, 
  iconClassName: string,
  placeholder?: string
}) => {
  const isMapsLoaded = useGoogleMaps(GOOGLE_MAPS_API_KEY);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (isMapsLoaded && inputRef.current && !disabled) {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        fields: ["formatted_address", "geometry", "name"],
        types: ["establishment", "geocode"]
      });

      autocomplete.addListener("place_changed", () => {
        const place: any = autocomplete.getPlace();
        if (place.formatted_address) {
          onChange(place.formatted_address);
        } else if (place.name) {
          onChange(place.name);
        }
      });
    }
  }, [isMapsLoaded, disabled, onChange]);

  useEffect(() => {
    if (isMapOpen && isMapsLoaded && mapContainer) {
      setMapError(null);
      const geocoder = new window.google.maps.Geocoder();
      
      geocoder.geocode({ address: value }, (results: any[], status: any) => {
        if (status === "OK" && results && results[0]) {
          const location = results[0].geometry.location;
          const map = new window.google.maps.Map(mapContainer, {
            center: location,
            zoom: 14,
            styles: GOOGLE_MAP_STYLES,
            disableDefaultUI: true,
            zoomControl: true,
          });

          new window.google.maps.Marker({
            map: map,
            position: location,
            animation: window.google.maps.Animation.DROP
          });
        } else {
          setMapError("Could not locate this address. Please try a different query.");
        }
      });
    }
  }, [isMapOpen, isMapsLoaded, mapContainer, value]);

  return (
    <div className="space-y-1">
        <Label className={cn("text-xs font-semibold text-slate-500", iconClassName)}>{label}</Label>
        <div className="relative flex gap-2">
            <div className="relative flex-1 group">
                <Input 
                  ref={inputRef}
                  className={cn("h-10 bg-slate-50 text-xs pl-9 transition-all shadow-sm", iconClassName.includes('amber') ? "border-amber-200 focus:border-amber-400" : "border-blue-200 focus:border-blue-400")}
                  placeholder={placeholder || "Enter address..."}
                  value={value} 
                  onChange={(e) => onChange(e.target.value)} 
                  disabled={disabled}
                />
                <MapPin className={cn("absolute left-3 top-3 h-4 w-4", iconClassName)} />
            </div>
            
            <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className={cn("h-10 w-10 shrink-0 bg-white", disabled && "opacity-50")}
                  disabled={disabled || !value}
                  title="Verify Address on Map"
                >
                  <Globe className={cn("h-4 w-4", iconClassName)} />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-white p-0 overflow-hidden rounded-lg">
                <DialogHeader className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <DialogTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    Address Verification
                  </DialogTitle>
                </DialogHeader>
                
                <div className="relative w-full h-[400px] bg-slate-100">
                  {!isMapsLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" /> Loading Maps API...
                    </div>
                  )}
                  
                  {mapError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 gap-2 bg-slate-50 p-4 text-center z-10">
                      <AlertTriangle className="h-8 w-8" /> 
                      <p className="text-sm font-medium">{mapError}</p>
                      <p className="text-xs text-slate-400">"{value}"</p>
                    </div>
                  )}

                  <div ref={setMapContainer} className="w-full h-full" />
                  
                  <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur text-white p-3 rounded-lg border border-slate-700 shadow-xl pointer-events-none">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Verifying Location</span>
                    <p className="text-xs font-medium">{value}</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
        </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------------------------------

// Helper for Mode Buttons
const ModeButton = ({ 
  mode, current, onClick 
}: { 
  mode: TransportMode, current: TransportMode, onClick: () => void 
}) => {
  const icons = {
    'SEA_FCL': <Container className="h-5 w-5" />,
    'SEA_LCL': <Box className="h-5 w-5" />,
    'AIR': <Plane className="h-5 w-5" />,
    'ROAD': <Truck className="h-5 w-5" />
  };
  const labels = {
    'SEA_FCL': 'Sea FCL',
    'SEA_LCL': 'Sea LCL',
    'AIR': 'Air Freight',
    'ROAD': 'Road Freight'
  };

  const isActive = mode === current;

  return (
    <div 
      onClick={onClick}
      className={cn(
        "cursor-pointer flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 h-24",
        isActive 
          ? "border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-100" 
          : "border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      <div className={cn("transition-colors", isActive ? "text-blue-600" : "text-slate-400")}>
        {icons[mode]}
      </div>
      <span className={cn("text-[10px] font-bold uppercase tracking-wide", isActive ? "text-blue-700" : "text-slate-500")}>
        {labels[mode]}
      </span>
    </div>
  );
};

// Full Incoterm List
const INCOTERMS: Incoterm[] = [
    'EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'FAS', 'FOB', 'CFR', 'CIF'
];

interface QuickQuoteBuilderProps {
    onGeneratePDF: () => void;
}

export function QuickQuoteBuilder({ onGeneratePDF }: QuickQuoteBuilderProps) {
  const { 
    // Identity
    reference, clientName, setClientSnapshot,
    // Route
    pol, pod, mode, incoterm, setMode, setIncoterm, setRouteLocations,
    placeOfLoading, placeOfDelivery, // Added these destructures
    validityDate, requestedDepartureDate, estimatedArrivalDate, setIdentity,
    transitTime, freeTime, setLogisticsParam,
    // Equipment / Cargo
    equipmentList, updateEquipment, addEquipment, removeEquipment,
    cargoRows, updateCargo, goodsDescription, isHazmat, isReefer,
    totalVolume, chargeableWeight, totalWeight, totalPackages,
    // Pricing
    items, addLineItem, updateLineItem, removeLineItem, initializeSmartLines,
    totalSellTarget, totalTTCTarget, quoteCurrency, totalMarginMAD, totalSellMAD
  } = useQuoteStore();

  const { clients, fetchClients } = useClientStore();
  const { fetchRates } = useTariffStore();
  const { toast } = useToast();
  
  // Local State for RFQ Dialog
  const [rfqText, setRfqText] = useState("");
  const [isRfqOpen, setIsRfqOpen] = useState(false);

  useEffect(() => {
    if (clients.length === 0) fetchClients();
    fetchRates(); 
  }, []);

  // -- LOGIC HELPERS --
  const isFCL = mode === 'SEA_FCL' || mode === 'ROAD'; 
  const showFreeTime = mode === 'SEA_FCL' || mode === 'SEA_LCL';
  const marginPercent = totalSellMAD > 0 ? ((totalMarginMAD / totalSellMAD) * 100).toFixed(1) : "0.0";

  // Address Logic (Copied from RouteSelector logic)
  const showPlaceOfLoading = incoterm === 'EXW';
  const showPlaceOfDelivery = ['DAP', 'DPU', 'DDP'].includes(incoterm);

  // -- HANDLERS --

  const handleRequestRates = () => {
    if (!pol || !pod) {
        toast("Missing Route Information", "error");
        return;
    }

    const selectedClient = clients.find(c => c.entityName === clientName);
    const clientFinancials = selectedClient?.financials || {};

    initializeSmartLines(clientFinancials);
    toast(`Auto-Rate applied for ${clientName || 'Standard'} based on route & profile.`, "success");
  };

  const handleAddQuickLine = (section: 'FREIGHT' | 'ORIGIN' | 'DESTINATION') => {
      addLineItem(section, { 
          description: '', 
          buyPrice: 0, 
          markupValue: 20,
          source: 'MANUAL'
      });
  };

  // Agent RFQ Generator (Preserved Feature)
  const generateAgentRFQ = () => {
      const equipString = equipmentList && equipmentList.length > 0
          ? equipmentList.map(e => `${e.count}x ${e.type}`).join(', ')
          : "LCL / Shared";

      const etdStr = requestedDepartureDate ? format(new Date(requestedDepartureDate), 'dd MMM yyyy') : 'TBD';
      const etaStr = estimatedArrivalDate ? format(new Date(estimatedArrivalDate), 'dd MMM yyyy') : 'TBD';
      
      const text = `Subject: RFQ: ${mode} - ${pol.split('(')[0].trim()} to ${pod.split('(')[0].trim()} - ETD ${etdStr} - Ref: ${reference}

Dear Partner,

Please provide your best spot rate availability for the following shipment.

📦 SHIPMENT DETAILS
------------------------------------------------
• Mode:           ${mode} (${incoterm})
• Route:          ${pol} ➡️ ${pod}
• Target ETD:     ${etdStr}
• Target ETA:     ${etaStr}

📋 CARGO SPECIFICATIONS
------------------------------------------------
• Commodity:      ${goodsDescription || 'General Cargo'}
• Equipment:      ${equipString}
• Packages:       ${totalPackages || 0} Pkgs
• Gross Weight:   ${totalWeight || 0} kg
• Chargeable Wgt: ${chargeableWeight || 0} kg
• Volume:         ${totalVolume || 0} m3
• Special:        ${isHazmat ? 'HAZMAT' : 'Non-Hazardous'} | ${isReefer ? 'REEFER' : 'Ambient / General'}

📏 DIMENSIONS
------------------------------------------------
${cargoRows.map(r => `   - ${r.qty}x ${r.pkgType} (${r.length}x${r.width}x${r.height}cm) - ${r.weight}kg`).join('\n')}

Please advise:
1. All-in freight charges (Air/Sea)
2. Local charges at origin/destination (if applicable)
3. Estimated Transit Time & Frequency
4. Validity of the offer

Looking forward to your swift offer.

Best regards,`;
      
      setRfqText(text);
      setIsRfqOpen(true);
  };

  const handleCopyRFQ = () => {
      navigator.clipboard.writeText(rfqText);
      toast("RFQ text copied to clipboard!", "success");
  };

  // Cargo Row Management (Expert Mode Parity)
  const addCargoRow = () => {
      const newRow = {
          id: Math.random().toString(36).substring(7),
          qty: 1,
          pkgType: 'PALLETS' as PackagingType,
          length: 120,
          width: 80,
          height: 100,
          weight: 100,
          isStackable: true
      };
      updateCargo([...cargoRows, newRow]);
  };

  const removeCargoRow = (id: string) => {
      if (cargoRows.length <= 1) return;
      const newRows = cargoRows.filter(r => r.id !== id);
      updateCargo(newRows);
  };

  const updateCargoRow = (id: string, field: string, value: any) => {
      const newRows = cargoRows.map(r => {
          if (r.id === id) {
              return { ...r, [field]: value };
          }
          return r;
      });
      updateCargo(newRows);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-6 animate-in slide-in-from-bottom-2 duration-500">
      
      {/* HEADER: TITLE & STATUS */}
      <div className="flex justify-between items-end mb-6">
          <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                  <Wand2 className="h-6 w-6 text-purple-600" />
                  Quick Quote Builder
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                  Express mode for rapid rate estimation and offer generation.
              </p>
          </div>
          <div className="flex gap-3">
             <Button 
                variant="outline" 
                onClick={generateAgentRFQ}
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
             >
                 <Mail className="h-4 w-4 mr-2" />
                 Agent Request
             </Button>

             <Button 
                variant="outline" 
                onClick={handleRequestRates}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
             >
                 <Zap className="h-4 w-4 mr-2" />
                 Auto-Rate
             </Button>
             
             <Button onClick={onGeneratePDF} className="bg-slate-900 text-white hover:bg-slate-800">
                 <FileOutput className="h-4 w-4 mr-2" />
                 Preview Quote
             </Button>
          </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* ================= LEFT COLUMN: LOGISTICS (Client, Route, Cargo) ================= */}
          <div className="xl:col-span-7 space-y-6">
              
              {/* SECTION 1: IDENTITY & ROUTE */}
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-500" /> Logistics Profile
                    </h2>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-white text-slate-500 font-mono">
                            {validityDate}
                        </Badge>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Client Select */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-500">Customer</Label>
                            <Select 
                                value={clientName} 
                                onValueChange={(val) => {
                                    const c = clients.find(cl => cl.entityName === val);
                                    if(c) {
                                        setClientSnapshot({ 
                                            id: c.id, 
                                            name: c.entityName, 
                                            terms: c.financials.paymentTerms,
                                            taxId: c.financials.taxId,
                                            ice: c.financials.ice,
                                            salespersonId: c.salesRepId, 
                                            salespersonName: "Assigned Rep"
                                        });
                                    }
                                }}
                            >
                                <SelectTrigger className={cn("h-10 bg-slate-50", !clientName && "border-red-300 ring-2 ring-red-50")}>
                                    <SelectValue placeholder="Select Client..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(c => (
                                        <SelectItem key={c.id} value={c.entityName}>{c.entityName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-500">Reference</Label>
                            <Input 
                                disabled 
                                value={reference} 
                                className="h-10 bg-slate-50 text-slate-400 font-mono text-xs" 
                            />
                        </div>
                    </div>

                    {/* Mode Buttons */}
                    <div>
                        <Label className="text-xs font-semibold text-slate-500 mb-2 block">Transport Mode</Label>
                        <div className="grid grid-cols-4 gap-3">
                            {(['SEA_FCL', 'SEA_LCL', 'AIR', 'ROAD'] as TransportMode[]).map(m => (
                                <ModeButton key={m} mode={m} current={mode} onClick={() => setMode(m)} />
                            ))}
                        </div>
                    </div>

                    {/* Route Stack */}
                    <div className="space-y-4">
                        {/* Pickup Address (EXW) */}
                        {showPlaceOfLoading && (
                            <div className="animate-in slide-in-from-top-1 fade-in duration-300">
                                <AddressWithMap 
                                    label="Pickup Address (Origin)"
                                    placeholder="Factory address, Zip code..."
                                    value={placeOfLoading}
                                    onChange={(val) => setRouteLocations('placeOfLoading', val)}
                                    iconClassName="text-amber-500"
                                />
                            </div>
                        )}

                        {/* Ports Grid */}
                        <div className="grid grid-cols-12 gap-4 items-end">
                             <div className="col-span-12 md:col-span-5 space-y-1.5">
                                <SmartPortSelector 
                                    label="Origin (POL)" 
                                    value={pol} 
                                    onChange={(v) => setRouteLocations('pol', v)}
                                    icon={MapPin}
                                />
                             </div>
                             <div className="hidden md:flex col-span-2 items-center justify-center pb-2">
                                <ArrowRight className="h-5 w-5 text-slate-300" />
                             </div>
                             <div className="col-span-12 md:col-span-5 space-y-1.5">
                                <SmartPortSelector 
                                    label="Destination (POD)" 
                                    value={pod} 
                                    onChange={(v) => setRouteLocations('pod', v)}
                                    icon={MapPin}
                                />
                             </div>
                        </div>

                        {/* Delivery Address (DAP/DDP) */}
                        {showPlaceOfDelivery && (
                            <div className="animate-in slide-in-from-bottom-1 fade-in duration-300">
                                <AddressWithMap 
                                    label="Final Delivery Address"
                                    placeholder="Warehouse address, City..."
                                    value={placeOfDelivery}
                                    onChange={(val) => setRouteLocations('placeOfDelivery', val)}
                                    iconClassName="text-blue-500"
                                />
                            </div>
                        )}
                    </div>
                    
                    {/* DATES & INCOTERM */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                             <Label className="text-xs font-semibold text-slate-500">Incoterm</Label>
                             <Select value={incoterm} onValueChange={(v: Incoterm) => setIncoterm(v)}>
                                <SelectTrigger className="h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {INCOTERMS.map(t => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                             </Select>
                        </div>
                        <div className="space-y-1.5">
                             <Label className="text-xs font-semibold text-slate-500">Target ETD</Label>
                             <div className="relative">
                                <Input 
                                    type="date" 
                                    className="h-10 pl-9"
                                    value={requestedDepartureDate ? requestedDepartureDate.toString().split('T')[0] : ''}
                                    onChange={(e) => setIdentity('requestedDepartureDate', e.target.value)}
                                />
                                <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                             </div>
                        </div>
                        <div className="space-y-1.5">
                             <Label className="text-xs font-semibold text-slate-500">Target ETA</Label>
                             <div className="relative">
                                <Input 
                                    type="date" 
                                    className="h-10 pl-9"
                                    value={estimatedArrivalDate ? estimatedArrivalDate.toString().split('T')[0] : ''}
                                    onChange={(e) => setIdentity('estimatedArrivalDate', e.target.value)}
                                />
                                <Clock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                             </div>
                        </div>
                    </div>

                    {/* LOGISTICS PARAMETERS (New Feature) */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-500">Est. Transit (Days)</Label>
                            <div className="relative">
                                <Input 
                                    type="number" className="h-9 pl-9 bg-slate-50" 
                                    value={transitTime}
                                    onChange={(e) => setLogisticsParam('transitTime', parseInt(e.target.value) || 0)}
                                />
                                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            </div>
                        </div>

                        {showFreeTime && (
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-500">Free Time (Days)</Label>
                                <div className="relative">
                                    <Input 
                                        type="number" className="h-9 pl-9 bg-slate-50" 
                                        value={freeTime}
                                        onChange={(e) => setLogisticsParam('freeTime', parseInt(e.target.value) || 0)}
                                    />
                                    <Anchor className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
              </section>

              {/* SECTION 2: CARGO & EQUIPMENT */}
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                        <Package className="h-4 w-4 text-amber-500" /> Cargo Specification
                    </h2>
                    {isFCL ? (
                        <Button variant="ghost" size="sm" onClick={() => addEquipment('40HC', 1)} className="h-7 text-xs text-blue-600">
                            <Plus className="h-3 w-3 mr-1" /> Add Unit
                        </Button>
                    ) : (
                         <Button variant="ghost" size="sm" onClick={addCargoRow} className="h-7 text-xs text-blue-600">
                             <Plus className="h-3 w-3 mr-1" /> Add Line
                         </Button>
                    )}
                </div>

                <div className="p-6 space-y-4">
                    
                    {/* GOODS DESC */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-500">Commodity (Description)</Label>
                        <Input 
                            value={goodsDescription} 
                            onChange={(e) => setIdentity('goodsDescription', e.target.value)}
                            placeholder="E.g. Auto parts, Textiles, General Cargo..."
                            className="h-10 bg-slate-50"
                        />
                    </div>

                    {isFCL ? (
                        <div className="space-y-3">
                            {equipmentList.map((eq, idx) => (
                                <div key={eq.id} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                                    <Badge variant="outline" className="bg-slate-100 text-slate-500 h-9 w-9 flex items-center justify-center rounded-lg border-slate-200">
                                        {idx + 1}
                                    </Badge>
                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-[10px] text-slate-400 uppercase font-bold">Qty</Label>
                                            <Input 
                                                type="number" 
                                                min={1}
                                                className="h-9 font-bold text-center"
                                                value={eq.count}
                                                onChange={(e) => updateEquipment(eq.id, eq.type, parseInt(e.target.value) || 1)}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[10px] text-slate-400 uppercase font-bold">Type</Label>
                                            <Select value={eq.type} onValueChange={(v) => updateEquipment(eq.id, v, eq.count)}>
                                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="20DV">20' Dry Standard</SelectItem>
                                                    <SelectItem value="40HC">40' High Cube</SelectItem>
                                                    <SelectItem value="40RF">40' Reefer</SelectItem>
                                                    <SelectItem value="FTL Mega">FTL Mega Trailer</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {equipmentList.length > 1 && (
                                        <div className="pt-4">
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-300 hover:text-red-500" onClick={() => removeEquipment(eq.id)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* MULTI-ROW CARGO INPUTS (Expert Mode Parity) */}
                            <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide px-2">
                                <div className="col-span-1">Qty</div>
                                <div className="col-span-2">Type</div>
                                <div className="col-span-3 text-center">Dims (LxWxH cm)</div>
                                <div className="col-span-2">Unit Wgt (kg)</div>
                                <div className="col-span-2">Total Wgt</div>
                                <div className="col-span-2"></div>
                            </div>

                            <div className="space-y-2">
                                {cargoRows.map((row) => (
                                    <div key={row.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <div className="col-span-1">
                                            <Input 
                                                className="h-8 text-center px-0 font-bold" 
                                                value={row.qty}
                                                onChange={(e) => updateCargoRow(row.id, 'qty', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Select value={row.pkgType} onValueChange={(v) => updateCargoRow(row.id, 'pkgType', v)}>
                                                <SelectTrigger className="h-8 text-xs px-2"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="PALLETS">Pallets</SelectItem>
                                                    <SelectItem value="CARTONS">Cartons</SelectItem>
                                                    <SelectItem value="CRATES">Crates</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-3 flex gap-1">
                                            <Input placeholder="L" className="h-8 text-center px-0 text-xs" value={row.length} onChange={(e) => updateCargoRow(row.id, 'length', parseFloat(e.target.value) || 0)} />
                                            <Input placeholder="W" className="h-8 text-center px-0 text-xs" value={row.width} onChange={(e) => updateCargoRow(row.id, 'width', parseFloat(e.target.value) || 0)} />
                                            <Input placeholder="H" className="h-8 text-center px-0 text-xs" value={row.height} onChange={(e) => updateCargoRow(row.id, 'height', parseFloat(e.target.value) || 0)} />
                                        </div>
                                        <div className="col-span-2">
                                            <Input 
                                                className="h-8 text-center px-0 text-xs" 
                                                value={row.weight}
                                                onChange={(e) => updateCargoRow(row.id, 'weight', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="col-span-2 flex items-center justify-between pl-2">
                                            <span className="text-xs font-mono font-bold text-slate-600">
                                                {(row.weight * row.qty).toLocaleString()}
                                            </span>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-500" onClick={() => removeCargoRow(row.id)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* TOTALS FOOTER */}
                            <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                                <div className="bg-blue-50 p-2 rounded-lg text-center">
                                    <div className="text-[10px] uppercase text-blue-500 font-bold">Total Pkgs</div>
                                    <div className="text-lg font-bold text-blue-700">{totalPackages}</div>
                                </div>
                                <div className="bg-blue-50 p-2 rounded-lg text-center">
                                    <div className="text-[10px] uppercase text-blue-500 font-bold">Gross Wgt</div>
                                    <div className="text-lg font-bold text-blue-700">{totalWeight} <span className="text-xs">kg</span></div>
                                </div>
                                <div className="bg-blue-50 p-2 rounded-lg text-center">
                                    <div className="text-[10px] uppercase text-blue-500 font-bold">Volume</div>
                                    <div className="text-lg font-bold text-blue-700">{totalVolume} <span className="text-xs">m³</span></div>
                                </div>
                                <div className="bg-emerald-50 p-2 rounded-lg text-center border border-emerald-100">
                                    <div className="text-[10px] uppercase text-emerald-600 font-bold">Chargeable</div>
                                    <div className="text-lg font-bold text-emerald-700">{chargeableWeight} <span className="text-xs">kg</span></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
              </section>

          </div>

          {/* ================= RIGHT COLUMN: COMMERCIAL (Pricing) ================= */}
          <div className="xl:col-span-5 space-y-6">
              
              {/* PRICING BUILDER CARD */}
              <section className="bg-white rounded-xl border border-slate-200 shadow-lg relative overflow-hidden flex flex-col h-full min-h-[500px]">
                  <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
                      <div>
                          <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-emerald-400" /> Commercial Offer
                          </h2>
                          <p className="text-xs text-slate-400 mt-1">Build your pricing structure</p>
                      </div>
                      <div className="text-right">
                          <div className="text-2xl font-black tracking-tight text-emerald-400">
                              {totalTTCTarget.toLocaleString()} <span className="text-sm text-emerald-600">{quoteCurrency}</span>
                          </div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Payable</div>
                      </div>
                  </div>

                  {/* Pricing Lines - Scrollable */}
                  <div className="flex-1 overflow-y-auto p-0 bg-slate-50/50">
                      
                      {items.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                              <Wand2 className="h-8 w-8 mb-2 opacity-20" />
                              <p className="text-xs">No lines added.</p>
                              <Button variant="link" size="sm" onClick={handleRequestRates}>
                                  Auto-Populate Defaults
                              </Button>
                          </div>
                      )}

                      <div className="divide-y divide-slate-100">
                          {items.map((item) => (
                              <div key={item.id} className="bg-white p-3 hover:bg-slate-50 group transition-colors">
                                  <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="outline" className={cn(
                                          "text-[9px] h-4 px-1 rounded-sm border-0 font-bold",
                                          item.section === 'FREIGHT' ? "bg-blue-100 text-blue-700" :
                                          item.section === 'ORIGIN' ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"
                                      )}>
                                          {item.section.substring(0,3)}
                                      </Badge>
                                      <Input 
                                        value={item.description} 
                                        onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                                        className="h-6 text-xs border-transparent focus:border-blue-300 px-1 font-medium bg-transparent" 
                                        placeholder="Description..."
                                      />
                                      <Button onClick={() => removeLineItem(item.id)} size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500">
                                          <X className="h-3 w-3" />
                                      </Button>
                                  </div>
                                  <div className="flex items-center gap-2 pl-6">
                                      <div className="flex-1">
                                          <Label className="text-[9px] text-slate-400 uppercase">Cost</Label>
                                          <div className="flex items-center gap-1">
                                              <Input 
                                                type="number"
                                                value={item.buyPrice}
                                                onChange={(e) => updateLineItem(item.id, { buyPrice: parseFloat(e.target.value) || 0 })}
                                                className="h-7 text-xs bg-slate-50 border-slate-200" 
                                              />
                                              <Select value={item.buyCurrency} onValueChange={(v) => updateLineItem(item.id, { buyCurrency: v as Currency })}>
                                                  <SelectTrigger className="h-7 w-16 text-[10px]"><SelectValue /></SelectTrigger>
                                                  <SelectContent><SelectItem value="MAD">MAD</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent>
                                              </Select>
                                          </div>
                                      </div>
                                      <div className="w-20">
                                          <Label className="text-[9px] text-slate-400 uppercase">Markup %</Label>
                                          <Input 
                                            type="number"
                                            value={item.markupValue}
                                            onChange={(e) => updateLineItem(item.id, { markupValue: parseFloat(e.target.value) || 0 })}
                                            className="h-7 text-xs text-right font-mono text-emerald-600 bg-emerald-50/30 border-emerald-100" 
                                          />
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-3 bg-slate-100 border-t border-slate-200 grid grid-cols-3 gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => handleAddQuickLine('ORIGIN')} className="text-[10px] h-8 bg-white border-dashed text-slate-600 hover:text-amber-600 hover:border-amber-300">
                          + Origin
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleAddQuickLine('FREIGHT')} className="text-[10px] h-8 bg-white border-dashed text-slate-600 hover:text-blue-600 hover:border-blue-300">
                          + Freight
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleAddQuickLine('DESTINATION')} className="text-[10px] h-8 bg-white border-dashed text-slate-600 hover:text-purple-600 hover:border-purple-300">
                          + Dest.
                      </Button>
                  </div>

                  {/* Financial Footer */}
                  <div className="bg-white p-4 border-t border-slate-200 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Subtotal (Net)</span>
                          <span className="font-mono font-bold text-slate-700">{totalSellTarget.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Margin Profit</span>
                          <span className={cn("font-mono font-bold", parseFloat(marginPercent) < 15 ? "text-amber-500" : "text-emerald-600")}>
                              {totalMarginMAD.toLocaleString()} <span className="text-[10px] text-slate-400">({marginPercent}%)</span>
                          </span>
                      </div>
                  </div>
              </section>

              {/* Info Widget */}
              {mode && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                          <h4 className="text-xs font-bold text-blue-700 mb-1">Quote Tip</h4>
                          <p className="text-[11px] text-blue-600/80 leading-relaxed">
                              You are quoting in <strong>{mode}</strong> mode. 
                              Make sure to include specific {mode === 'AIR' ? 'AWB and Security' : 'THC and Documentation'} charges for accurate estimation.
                          </p>
                      </div>
                  </div>
              )}

          </div>

          {/* AGENT RFQ DIALOG */}
          <Dialog open={isRfqOpen} onOpenChange={setIsRfqOpen}>
              <DialogContent className="max-w-2xl">
                  <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                          <Mail className="h-5 w-5 text-indigo-600" />
                          Agent Rate Request (RFQ)
                      </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                      <p className="text-sm text-slate-500">
                          Review and copy the professional RFQ text below to send to your agent network.
                      </p>
                      <Textarea 
                          value={rfqText} 
                          readOnly 
                          className="h-80 font-mono text-xs bg-slate-50 border-slate-200" 
                      />
                      <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsRfqOpen(false)}>Close</Button>
                          <Button onClick={handleCopyRFQ} className="bg-indigo-600 hover:bg-indigo-700">
                              <Copy className="h-4 w-4 mr-2" />
                              Copy to Clipboard
                          </Button>
                      </div>
                  </div>
              </DialogContent>
          </Dialog>
      </div>
      
      <div className="h-12" />
    </div>
  );
}
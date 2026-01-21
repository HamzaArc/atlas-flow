import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Globe, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// 1. Declare Google Maps Types Globally to prevent TS errors
declare global {
  interface Window {
    google: any;
  }
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const GOOGLE_MAP_STYLES = [
  { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
];

const useGoogleMaps = (apiKey: string) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.google?.maps) {
      setIsLoaded(true);
      return;
    }
    if (!apiKey) {
      console.warn("Google Maps API Key is missing.");
      return;
    }
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

interface AddressWithMapProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  iconClassName?: string;
  placeholder?: string;
  required?: boolean;
}

export function AddressWithMap({ 
  label, 
  value, 
  onChange, 
  disabled, 
  iconClassName = "text-slate-400",
  placeholder,
  required
}: AddressWithMapProps) {
  const isMapsLoaded = useGoogleMaps(GOOGLE_MAPS_API_KEY);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize Autocomplete
  useEffect(() => {
    if (isMapsLoaded && inputRef.current && !disabled && window.google) {
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

  // Initialize Map Logic
  useEffect(() => {
    if (isMapOpen && isMapsLoaded && mapContainer && window.google) {
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
    <div className="space-y-1.5 w-full">
        <Label className={cn("text-[10px] font-bold uppercase tracking-wider flex justify-between", iconClassName)}>
            {label}
            {required && <span className="text-red-500">*</span>}
        </Label>
        <div className="relative flex gap-2">
            <div className="relative flex-1 group">
                <Input 
                  ref={inputRef}
                  className={cn("h-9 bg-white text-xs pl-9 transition-all shadow-sm", iconClassName.includes('amber') ? "border-amber-200 focus:border-amber-400" : "border-slate-200 focus:border-blue-400")}
                  placeholder={placeholder || "Enter address..."}
                  value={value} 
                  onChange={(e) => onChange(e.target.value)} 
                  disabled={disabled}
                />
                <MapPin className={cn("absolute left-3 top-2.5 h-4 w-4", iconClassName)} />
            </div>
            
            <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className={cn("h-9 w-9 shrink-0 bg-white border-slate-200", disabled && "opacity-50")}
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
}
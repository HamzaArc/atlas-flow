import { FilePlus, Ship, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useQuoteStore } from "@/store/useQuoteStore";
import { useDossierStore } from "@/store/useDossierStore";
import { useClientStore } from "@/store/useClientStore";

export function ActionCenter() {
  const navigate = useNavigate();
  const { createNewQuote } = useQuoteStore();
  const { createDossier } = useDossierStore();
  const { createClient } = useClientStore();

  const handleNewQuote = () => {
    createNewQuote();
    navigate('/quotes/create');
  };

  const handleNewDossier = () => {
    createDossier();
    // Assuming the store sets ID to 'new-timestamp' or similar
    navigate('/dossiers/new'); 
  };

  const handleNewClient = () => {
    createClient();
    navigate('/clients/new');
  };

  return (
    <Card className="h-full shadow-sm">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Initiate new workflows</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Button 
            onClick={handleNewQuote}
            className="w-full justify-start h-12 text-base bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg"
        >
          <FilePlus className="mr-3 h-5 w-5" />
          Create New Quote
        </Button>
        
        <Button 
            onClick={handleNewDossier}
            variant="outline" 
            className="w-full justify-start h-12 text-base border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition-colors"
        >
          <Ship className="mr-3 h-5 w-5" />
          Open Shipment File
        </Button>
        
        <Button 
            onClick={handleNewClient}
            variant="outline" 
            className="w-full justify-start h-12 text-base border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <UserPlus className="mr-3 h-5 w-5 text-slate-500" />
          Add Customer
        </Button>
      </CardContent>
    </Card>
  );
}
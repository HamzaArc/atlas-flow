import { useState } from 'react';
import { 
   MapPin, Box, Plus, Trash2, User, 
   ArrowRight, Mail, MoreHorizontal, Shield,
   Truck
} from "lucide-react";
import { useDossierStore } from "@/store/useDossierStore";
import { ShipmentParty, CargoItem, DossierContainer } from "@/types/index";

// Helper Components for consistency
const InputField = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => (
  <div className="flex-1">
    {label && <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>}
    <input
      {...props}
      className={`
        block w-full rounded-lg border-slate-300 bg-white text-sm text-slate-900 shadow-sm 
        placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 
        transition-all py-2.5 px-3 hover:border-slate-400 outline-none
        ${props.className || ''}
      `}
    />
  </div>
);

const SelectField = ({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) => (
  <div className="flex-1">
    {label && <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>}
    <div className="relative">
      <select
        {...props}
        className={`
          block w-full appearance-none rounded-lg border-slate-300 bg-white text-sm text-slate-900 shadow-sm 
          focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 
          transition-all py-2.5 pl-3 pr-10 hover:border-slate-400 outline-none
          ${props.className || ''}
        `}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
        <ArrowRight className="rotate-90 h-4 w-4" />
      </div>
    </div>
  </div>
);

export const DossierOperationsTab = () => {
  const { 
     dossier, updateDossier,
     addContainer, removeContainer 
  } = useDossierStore();

  // --- Local State for UI Toggles ---
  const [isAddingParty, setIsAddingParty] = useState(false);
  const [newParty, setNewParty] = useState<Partial<ShipmentParty>>({ role: 'Notify' });

  const [isAddingCargo, setIsAddingCargo] = useState(false);
  const [newCargo, setNewCargo] = useState<Partial<CargoItem>>({ packageType: 'Cartons' });

  const [isAddingContainer, setIsAddingContainer] = useState(false);
  const [newContainer, setNewContainer] = useState<Partial<DossierContainer>>({ type: '40HC' });

  // --- Handlers ---
  
  const handleAddParty = () => {
     if (!newParty.name) return;
     const partyToAdd: ShipmentParty = {
        id: Math.random().toString(36).substring(7),
        name: newParty.name,
        role: newParty.role as any,
        email: newParty.email,
        contact: newParty.contact
     };
     updateDossier('parties', [...(dossier.parties || []), partyToAdd]);
     setIsAddingParty(false);
     setNewParty({ role: 'Notify' });
  };

  const removeParty = (id: string) => {
     updateDossier('parties', dossier.parties.filter(p => p.id !== id));
  };

  const handleAddCargo = () => {
    if (!newCargo.description) return;
    const item: CargoItem = {
      id: `ci-${Date.now()}`,
      description: newCargo.description,
      packageCount: Number(newCargo.packageCount) || 0,
      packageType: newCargo.packageType || 'Pkgs',
      weight: Number(newCargo.weight) || 0,
      volume: Number(newCargo.volume) || 0,
      dimensions: newCargo.dimensions
    };
    updateDossier('cargoItems', [...(dossier.cargoItems || []), item]);
    setIsAddingCargo(false);
    setNewCargo({ packageType: 'Cartons' });
  };

  const removeCargo = (id: string) => {
    updateDossier('cargoItems', (dossier.cargoItems || []).filter(c => c.id !== id));
  };

  const handleAddContainer = () => {
     if (!newContainer.number) return;
     const containerToAdd: DossierContainer = {
        id: Math.random().toString(36).substring(7),
        number: newContainer.number.toUpperCase(),
        type: newContainer.type as any || '40HC',
        seal: newContainer.seal ? newContainer.seal.toUpperCase() : '',
        packages: Number(newContainer.packages) || 0,
        weight: Number(newContainer.weight) || 0,
        packageType: 'CARTONS',
        volume: 0,
        status: 'GATE_IN'
     };
     addContainer(containerToAdd);
     setIsAddingContainer(false);
     setNewContainer({ type: '40HC' });
  };

  // --- Totals ---
  // If we have cargo items, prioritize those for totals, otherwise fallback to container sums if cargo is empty
  const hasCargoItems = (dossier.cargoItems?.length || 0) > 0;
  
  const totalWeight = hasCargoItems 
    ? dossier.cargoItems?.reduce((sum, item) => sum + item.weight, 0) || 0
    : dossier.containers?.reduce((acc, c) => acc + (c.weight || 0), 0) || 0;

  const totalPkgs = hasCargoItems
    ? dossier.cargoItems?.reduce((sum, item) => sum + item.packageCount, 0) || 0
    : dossier.containers?.reduce((acc, c) => acc + (c.packages || 0), 0) || 0;

  const totalVolume = hasCargoItems
    ? dossier.cargoItems?.reduce((sum, item) => sum + item.volume, 0) || 0
    : dossier.containers?.reduce((acc, c) => acc + (c.volume || 0), 0) || 0;

  return (
    <div className="max-w-[1600px] mx-auto p-6 pb-24 space-y-6">
      
      {/* 2x2 GRID LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        
        {/* === LEFT COLUMN === */}
        <div className="flex flex-col gap-6 h-full">
          
          {/* CARD 1: Route & Schedule */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col relative z-20">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-white rounded-t-2xl">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg ring-1 ring-blue-100">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Route & Schedule</h3>
            </div>
            
            <div className="p-6 relative flex-1">
               {/* Visual Connector Line */}
              <div className="absolute left-[26px] top-20 bottom-12 w-0.5 bg-slate-100 hidden md:block z-0"></div>

              <div className="space-y-8 relative z-10">
                {/* POL */}
                <div className="flex flex-col md:flex-row gap-4 items-start">
                   <div className="hidden md:flex flex-col items-center mt-2 min-w-[50px]">
                      <div className="h-4 w-4 rounded-full border-4 border-white bg-blue-500 shadow-md ring-1 ring-blue-100"></div>
                   </div>
                   <div className="flex-1 w-full bg-slate-50/50 p-5 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                      <h4 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <ArrowRight className="h-3 w-3" /> Port of Loading
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField 
                           label="Location"
                           value={dossier.pol}
                           onChange={(e) => updateDossier('pol', e.target.value)}
                           placeholder="Search Port..."
                        />
                        <InputField 
                           label="Departure Date"
                           type="date"
                           value={dossier.etd ? new Date(dossier.etd).toISOString().split('T')[0] : ''}
                           onChange={(e) => updateDossier('etd', new Date(e.target.value))}
                        />
                      </div>
                   </div>
                </div>

                {/* POD */}
                <div className="flex flex-col md:flex-row gap-4 items-start">
                   <div className="hidden md:flex flex-col items-center mt-2 min-w-[50px]">
                      <div className="h-4 w-4 rounded-full border-4 border-white bg-green-500 shadow-md ring-1 ring-green-100"></div>
                   </div>
                   <div className="flex-1 w-full bg-slate-50/50 p-5 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                      <h4 className="text-[11px] font-bold text-green-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <ArrowRight className="h-3 w-3" /> Port of Discharge
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField 
                           label="Location"
                           value={dossier.pod}
                           onChange={(e) => updateDossier('pod', e.target.value)}
                           placeholder="Search Port..."
                        />
                        <InputField 
                           label="Arrival Date"
                           type="date"
                           value={dossier.eta ? new Date(dossier.eta).toISOString().split('T')[0] : ''}
                           onChange={(e) => updateDossier('eta', new Date(e.target.value))}
                        />
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: Parties Involved */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col flex-1 relative z-10">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg ring-1 ring-purple-100">
                    <User className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Parties Involved</h3>
               </div>
               {!isAddingParty && (
                 <button 
                  onClick={() => setIsAddingParty(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors flex items-center shadow-sm"
                 >
                   <Plus className="h-3.5 w-3.5 mr-1"/> Add Party
                 </button>
               )}
            </div>
            
            <div className="p-6 flex-1">
              {isAddingParty && (
                 <div className="mb-6 p-5 bg-slate-50 border border-dashed border-slate-300 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">New Party Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                       <div className="md:col-span-4">
                          <SelectField 
                             label="Role"
                             value={newParty.role} 
                             onChange={(e) => setNewParty({...newParty, role: e.target.value as any})}
                          >
                             <option value="Shipper">Shipper</option>
                             <option value="Consignee">Consignee</option>
                             <option value="Notify">Notify</option>
                             <option value="Agent">Agent</option>
                             <option value="Carrier">Carrier</option>
                          </SelectField>
                       </div>
                       <div className="md:col-span-8">
                          <InputField 
                             label="Company Name"
                             placeholder="e.g. Acme Trading Co."
                             value={newParty.name || ''}
                             onChange={e => setNewParty({...newParty, name: e.target.value})}
                          />
                       </div>
                       <div className="md:col-span-12">
                          <InputField 
                             label="Email Address"
                             type="email"
                             placeholder="contact@example.com"
                             value={newParty.email || ''}
                             onChange={e => setNewParty({...newParty, email: e.target.value})}
                          />
                       </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                       <button onClick={() => setIsAddingParty(false)} className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50">Cancel</button>
                       <button onClick={handleAddParty} className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-md">Save Party</button>
                    </div>
                 </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                 {[
                    { label: 'Shipper', data: dossier.shipper, id: 'shipper' },
                    { label: 'Consignee', data: dossier.consignee, id: 'consignee' },
                    ...(dossier.parties || [])
                 ].map((p: any, idx) => (
                    <div key={idx} className="group p-4 border border-slate-100 rounded-xl bg-white hover:border-blue-200 hover:shadow-md transition-all flex justify-between items-center">
                       <div className="flex items-start gap-4">
                          <div className="mt-1 h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                             <User className="h-4 w-4" />
                          </div>
                          <div>
                             <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{p.role || p.label}</span>
                             </div>
                             <div className="font-bold text-slate-900 text-sm">{p.data?.name || p.name || '—'}</div>
                             { (p.data?.email || p.email) && (
                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                                    <Mail className="h-3 w-3"/> {p.data?.email || p.email}
                                </div>
                             )}
                          </div>
                       </div>
                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"><MoreHorizontal className="h-4 w-4"/></button>
                         {p.id && p.id !== 'shipper' && p.id !== 'consignee' && (
                             <button onClick={() => removeParty(p.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"><Trash2 className="h-4 w-4"/></button>
                         )}
                       </div>
                    </div>
                 ))}
              </div>
            </div>
          </div>

        </div>

        {/* === RIGHT COLUMN === */}
        <div className="flex flex-col gap-6 h-full">

           {/* CARD 3: Cargo & Goods */}
           <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col relative z-20">
             <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg ring-1 ring-blue-100">
                    <Box className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Cargo & Goods</h3>
               </div>
               {!isAddingCargo && (
                 <button 
                  onClick={() => setIsAddingCargo(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors flex items-center shadow-sm"
                 >
                   <Plus className="h-3.5 w-3.5 mr-1"/> Add Item
                 </button>
               )}
            </div>

            <div className="p-6 flex-1">
               {/* Summary Stats */}
               <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center relative overflow-hidden group hover:border-slate-200 transition-colors">
                     <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity"><Box size={40}/></div>
                     <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Pkgs</div>
                     <div className="text-2xl font-bold text-slate-800 tracking-tight">{totalPkgs}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center relative overflow-hidden group hover:border-slate-200 transition-colors">
                     <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gross Wgt</div>
                     <div className="text-2xl font-bold text-slate-800 tracking-tight">{totalWeight.toLocaleString()} <span className="text-sm font-medium text-slate-400">KG</span></div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center relative overflow-hidden group hover:border-slate-200 transition-colors">
                     <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Volume</div>
                     <div className="text-2xl font-bold text-slate-800 tracking-tight">{totalVolume.toFixed(2)} <span className="text-sm font-medium text-slate-400">CBM</span></div>
                  </div>
               </div>

               {isAddingCargo && (
                  <div className="mb-6 p-5 bg-slate-50 border border-dashed border-slate-300 rounded-xl animate-in fade-in slide-in-from-top-2">
                     <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">New Cargo Item</h4>
                     <div className="grid grid-cols-1 gap-4 mb-4">
                        <div className="grid grid-cols-12 gap-4">
                           <div className="col-span-4">
                              <InputField 
                                label="Quantity"
                                type="number"
                                placeholder="0"
                                value={newCargo.packageCount || ''}
                                onChange={e => setNewCargo({...newCargo, packageCount: Number(e.target.value)})}
                              />
                           </div>
                           <div className="col-span-8">
                               <InputField 
                                label="Package Type"
                                placeholder="e.g. Cartons, Pallets"
                                value={newCargo.packageType || ''}
                                onChange={e => setNewCargo({...newCargo, packageType: e.target.value})}
                              />
                           </div>
                        </div>
                        <InputField 
                          label="Description"
                          placeholder="Goods description..."
                          value={newCargo.description || ''}
                          onChange={e => setNewCargo({...newCargo, description: e.target.value})}
                        />
                         <div className="grid grid-cols-2 gap-4">
                            <InputField 
                             label="Weight (KG)"
                             type="number" 
                             placeholder="0.00"
                             value={newCargo.weight || ''}
                             onChange={e => setNewCargo({...newCargo, weight: Number(e.target.value)})}
                           />
                           <InputField 
                             label="Volume (CBM)"
                             type="number" 
                             placeholder="0.000"
                             value={newCargo.volume || ''}
                             onChange={e => setNewCargo({...newCargo, volume: Number(e.target.value)})}
                           />
                         </div>
                     </div>
                     <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                        <button onClick={() => setIsAddingCargo(false)} className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50">Cancel</button>
                        <button onClick={handleAddCargo} className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-md">Add Item</button>
                     </div>
                  </div>
               )}

               <div className="space-y-3">
                  {dossier.cargoItems && dossier.cargoItems.map(item => (
                    <div key={item.id} className="group p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all bg-white relative">
                       <div className="flex justify-between items-start">
                          <div className="flex-1">
                             <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs border border-slate-200">{item.packageCount} {item.packageType}</span>
                                <span className="text-slate-300">|</span>
                                <span className="truncate">{item.description}</span>
                             </div>
                             <div className="gap-6 text-xs text-slate-500 font-medium bg-slate-50 px-3 py-2 rounded-lg inline-flex">
                                <div><span className="font-bold text-slate-900">{item.weight.toLocaleString()}</span> KG</div>
                                <div className="w-px h-3 bg-slate-300 my-auto"></div>
                                <div><span className="font-bold text-slate-900">{item.volume.toFixed(2)}</span> CBM</div>
                                {item.dimensions && (
                                  <>
                                   <div className="w-px h-3 bg-slate-300 my-auto"></div>
                                   <div>{item.dimensions}</div>
                                  </>
                                )}
                             </div>
                          </div>
                          <button onClick={() => removeCargo(item.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-red-50">
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
           </div>

           {/* CARD 4: Containers */}
           <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col flex-1 relative z-10">
               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg ring-1 ring-orange-100">
                      <Truck className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Containers</h3>
                  </div>
                  {!isAddingContainer && (
                    <button 
                      onClick={() => setIsAddingContainer(true)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors flex items-center shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1"/> Add Cntr
                    </button>
                  )}
               </div>
               
               <div className="p-6 flex-1">
                 {isAddingContainer && (
                    <div className="mb-6 p-5 bg-slate-50 border border-dashed border-slate-300 rounded-xl animate-in fade-in slide-in-from-top-2">
                       <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">New Container</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <InputField 
                            label="Container Number"
                            placeholder="e.g. CMAU1234567"
                            value={newContainer.number || ''}
                            onChange={e => setNewContainer({...newContainer, number: e.target.value.toUpperCase()})}
                          />
                          <SelectField 
                            label="Type"
                            value={newContainer.type}
                            onChange={e => setNewContainer({...newContainer, type: e.target.value as any})}
                          >
                             <option value="20DV">20' DV</option>
                             <option value="40HC">40' HC</option>
                             <option value="40RH">40' RH</option>
                             <option value="LCL">LCL</option>
                          </SelectField>
                          <InputField 
                            label="Seal Number"
                            placeholder="e.g. SL-998877"
                            value={newContainer.seal || ''}
                            onChange={e => setNewContainer({...newContainer, seal: e.target.value.toUpperCase()})}
                          />
                          <div className="grid grid-cols-2 gap-4">
                             <InputField 
                                label="Packages"
                                type="number" 
                                placeholder="0"
                                value={newContainer.packages || ''} 
                                onChange={e => setNewContainer({...newContainer, packages: +e.target.value})}
                              />
                             <InputField 
                                label="VGM (KG)"
                                type="number" 
                                placeholder="0" 
                                value={newContainer.weight || ''}
                                onChange={e => setNewContainer({...newContainer, weight: +e.target.value})}
                              />
                          </div>
                       </div>
                       <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                          <button onClick={() => setIsAddingContainer(false)} className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50">Cancel</button>
                          <button onClick={handleAddContainer} className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-md">Add Container</button>
                       </div>
                    </div>
                 )}

                 <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm">
                   <table className="min-w-full divide-y divide-slate-100">
                     <thead className="bg-slate-50">
                       <tr>
                         <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Container / Seal</th>
                         <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Details</th>
                         <th className="relative px-4 py-3"><span className="sr-only">Actions</span></th>
                       </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-slate-100">
                       {dossier.containers.map(container => (
                         <tr key={container.id} className="hover:bg-blue-50/30 transition-colors group">
                           <td className="px-4 py-3">
                             <div className="text-sm font-bold text-slate-900 font-mono tracking-wide">{container.number}</div>
                             <div className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                               <Shield size={10} className="text-green-500"/> {container.seal || 'No Seal'}
                             </div>
                           </td>
                           <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 mb-1 border border-blue-100">
                                {container.type}
                              </span>
                              <div className="text-xs text-slate-500 font-medium">
                                {container.packages} pkgs • {container.weight?.toLocaleString()} kg
                              </div>
                           </td>
                           <td className="px-4 py-3 text-right">
                             <button onClick={() => removeContainer(container.id)} className="p-2 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-red-50">
                               <Trash2 size={16}/>
                             </button>
                           </td>
                         </tr>
                       ))}
                       {dossier.containers.length === 0 && (
                          <tr><td colSpan={3} className="px-4 py-6 text-center text-xs text-slate-400 italic">No cargo units added.</td></tr>
                       )}
                     </tbody>
                   </table>
                 </div>
               </div>
           </div>

        </div>

      </div>
      
      {/* Save Area */}
      <div className="flex items-center justify-between pt-8 mt-6 border-t border-slate-200">
        <span className="text-sm text-slate-500 flex items-center bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
          <Shield className="h-4 w-4 text-green-500 mr-2" />
          All changes saved locally
        </span>
      </div>
    </div>
  );
};
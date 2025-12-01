import { useEffect } from 'react';
import { 
  Search, Plus, Filter, MoreHorizontal, 
  Building2, ArrowUpRight, AlertCircle, 
  FileText, Wallet, LayoutGrid, List
} from "lucide-react";

import { useClientStore, Client } from "@/store/useClientStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

interface ClientListPageProps {
    onNavigate: (view: 'list' | 'details') => void;
}

export default function ClientListPage({ onNavigate }: ClientListPageProps) {
  const { 
      clients, fetchClients, isLoading, 
      filters, setSearch, setFilterStatus,
      createClient, loadClient, deleteClient 
  } = useClientStore();

  useEffect(() => {
      fetchClients();
  }, []);

  // --- FILTER LOGIC (Explicit Typing Fix) ---
  const filteredData = clients.filter((client: Client) => {
      const matchesSearch = client.entityName.toLowerCase().includes(filters.search.toLowerCase()) || 
                            client.email.toLowerCase().includes(filters.search.toLowerCase());
      const matchesStatus = filters.status === 'ALL' || client.status === filters.status;
      return matchesSearch && matchesStatus;
  });

  // --- STATS CALCULATION ---
  const stats = {
      total: clients.length,
      active: clients.filter((c: Client) => c.status === 'ACTIVE').length,
      creditRisk: clients.filter((c: Client) => (c.creditLimit > 0 && (c.creditUsed / c.creditLimit) > 0.9)).length,
      totalCredit: clients.reduce((acc, c: Client) => acc + c.creditUsed, 0)
  };

  const handleCreate = () => {
      createClient();
      onNavigate('details');
  };

  const handleRowClick = (id: string) => {
      loadClient(id);
      onNavigate('details');
  };

  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'ACTIVE': return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-none">Active</Badge>;
          case 'PROSPECT': return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 shadow-none">Prospect</Badge>;
          case 'SUSPENDED': return <Badge variant="destructive" className="bg-amber-50 text-amber-700 border-amber-200 shadow-none">Suspended</Badge>;
          case 'BLACKLISTED': return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 shadow-none">Blacklisted</Badge>;
          default: return <Badge variant="secondary">{status}</Badge>;
      }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50/50">
      
      {/* 1. TOP HEADER */}
      <div className="px-8 py-6 border-b border-slate-200 bg-white sticky top-0 z-10 flex justify-between items-center">
          <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Client Directory</h1>
              <p className="text-slate-500 text-sm mt-1">Manage relationships, credit limits, and master data.</p>
          </div>
          <div className="flex gap-3">
              <Button variant="outline" className="bg-white hover:bg-slate-50 border-slate-300 text-slate-700">
                  <FileText className="h-4 w-4 mr-2" /> Export CSV
              </Button>
              <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 shadow-sm transition-all">
                  <Plus className="h-4 w-4 mr-2" /> Add Client
              </Button>
          </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
          
          {/* 2. KPI CARDS */}
          <div className="grid grid-cols-4 gap-4 mb-8">
              <Card className="border-slate-200 shadow-sm bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Entities</CardTitle>
                      <Building2 className="h-4 w-4 text-slate-400" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                  </CardContent>
              </Card>
              <Card className="border-slate-200 shadow-sm bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Active Accounts</CardTitle>
                      <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold text-emerald-700">{stats.active}</div>
                  </CardContent>
              </Card>
              <Card className="border-slate-200 shadow-sm bg-red-50/30">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs font-medium text-red-600 uppercase tracking-wider">Credit Risk</CardTitle>
                      <AlertCircle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold text-red-700">{stats.creditRisk}</div>
                      <p className="text-[10px] text-red-500 mt-1 font-medium">Exceeding 90% Limit</p>
                  </CardContent>
              </Card>
              <Card className="border-slate-200 shadow-sm bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs font-medium text-blue-600 uppercase tracking-wider">Total Exposure</CardTitle>
                      <Wallet className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold text-blue-900">{(stats.totalCredit / 1000).toFixed(1)}k <span className="text-sm font-normal text-slate-400">MAD</span></div>
                  </CardContent>
              </Card>
          </div>

          {/* 3. TOOLBAR */}
          <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 flex-1">
                  <div className="relative w-72">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input 
                          placeholder="Search by name or email..." 
                          className="pl-9 border-slate-200 bg-slate-50 focus:bg-white transition-all rounded-lg" 
                          value={filters.search}
                          onChange={(e) => setSearch(e.target.value)}
                      />
                  </div>
                  <div className="h-6 w-px bg-slate-200"></div>
                  <Select value={filters.status} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[160px] border-slate-200 bg-slate-50 rounded-lg">
                          <Filter className="h-3.5 w-3.5 mr-2 text-slate-500" />
                          <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="ALL">All Statuses</SelectItem>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="PROSPECT">Prospect</SelectItem>
                          <SelectItem value="SUSPENDED">Suspended</SelectItem>
                          <SelectItem value="BLACKLISTED">Blacklisted</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              <div className="flex items-center border rounded-lg overflow-hidden">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none bg-slate-100 text-slate-600"><List className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none hover:bg-slate-50 text-slate-400"><LayoutGrid className="h-4 w-4" /></Button>
              </div>
          </div>

          {/* 4. DATA TABLE */}
          <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl">
              <Table>
                  <TableHeader className="bg-slate-50/80">
                      <TableRow className="hover:bg-transparent">
                          <TableHead className="w-[280px] font-bold text-slate-500">Entity Name</TableHead>
                          <TableHead className="font-bold text-slate-500">Status</TableHead>
                          <TableHead className="font-bold text-slate-500">Type</TableHead>
                          <TableHead className="font-bold text-slate-500">Location</TableHead>
                          <TableHead className="w-[220px] font-bold text-slate-500">Credit Usage</TableHead>
                          <TableHead className="text-right font-bold text-slate-500">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {isLoading ? (
                          <TableRow>
                              <TableCell colSpan={6} className="h-32 text-center text-slate-500 animate-pulse">Refreshing directory...</TableCell>
                          </TableRow>
                      ) : filteredData.length === 0 ? (
                          <TableRow>
                              <TableCell colSpan={6} className="h-64 text-center">
                                  <div className="flex flex-col items-center justify-center text-slate-400">
                                      <Building2 className="h-12 w-12 opacity-10 mb-3" />
                                      <p className="text-lg font-semibold text-slate-700">No clients found</p>
                                      <p className="text-sm">Try adjusting your filters or create a new client.</p>
                                      <Button variant="link" onClick={handleCreate} className="mt-2 text-blue-600">Create Now</Button>
                                  </div>
                              </TableCell>
                          </TableRow>
                      ) : (
                          filteredData.map((client: Client) => (
                              <TableRow key={client.id} className="group cursor-pointer hover:bg-blue-50/40 transition-colors" onClick={() => handleRowClick(client.id)}>
                                  <TableCell>
                                      <div className="flex items-center gap-3">
                                          <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shadow-sm">
                                              {client.entityName.substring(0,2).toUpperCase()}
                                          </div>
                                          <div>
                                              <div className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{client.entityName}</div>
                                              <div className="text-xs text-slate-500">{client.email}</div>
                                          </div>
                                      </div>
                                  </TableCell>
                                  <TableCell>{getStatusBadge(client.status)}</TableCell>
                                  <TableCell>
                                      <Badge variant="outline" className="text-slate-600 text-[10px] bg-slate-50 border-slate-200">{client.type}</Badge>
                                  </TableCell>
                                  <TableCell className="text-sm text-slate-600 font-medium">
                                      {client.city}, {client.country}
                                  </TableCell>
                                  <TableCell>
                                      <div className="w-full pr-4">
                                          <div className="flex justify-between text-[10px] mb-1.5 font-medium text-slate-500">
                                              <span>{Math.round((client.creditUsed / (client.creditLimit || 1)) * 100)}% Used</span>
                                              <span>{client.financials.currency}</span>
                                          </div>
                                          <Progress 
                                              value={(client.creditUsed / (client.creditLimit || 1)) * 100} 
                                              className="h-1.5 bg-slate-100" 
                                              indicatorClassName={(client.creditUsed / client.creditLimit) > 0.9 ? 'bg-red-500' : 'bg-blue-600'}
                                          />
                                      </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                      <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                                                  <MoreHorizontal className="h-4 w-4" />
                                              </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="w-48">
                                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRowClick(client.id); }}>
                                                  Edit Profile
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>View Invoices</DropdownMenuItem>
                                              <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={(e) => { e.stopPropagation(); deleteClient(client.id); }}>
                                                  Delete Account
                                              </DropdownMenuItem>
                                          </DropdownMenuContent>
                                      </DropdownMenu>
                                  </TableCell>
                              </TableRow>
                          ))
                      )}
                  </TableBody>
              </Table>
          </Card>
      </div>
    </div>
  );
}
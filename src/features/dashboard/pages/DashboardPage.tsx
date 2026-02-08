import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, Area, Tooltip, ResponsiveContainer, 
  RadialBarChart, RadialBar} from 'recharts';
import { 
  Briefcase, FileText, Activity, 
  ArrowUpRight, Ship 
} from "lucide-react";

import { useDossierStore } from '@/store/useDossierStore';
import { useQuoteStore } from '@/store/useQuoteStore';
import { useClientStore } from '@/store/useClientStore';
import { useUserStore } from '@/store/useUserStore';
import { BentoGrid, BentoGridItem } from '../components/BentoGrid';
import { Badge } from '@/components/ui/badge';
import { ActionCenter } from '../components/ActionCenter';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { dossiers, fetchDossiers } = useDossierStore();
  const { quotes, fetchQuotes } = useQuoteStore();
  const { fetchClients } = useClientStore();
  const { fetchUsers } = useUserStore();

  useEffect(() => {
    fetchDossiers();
    fetchQuotes();
    fetchClients();
    fetchUsers();
  }, []);

  // --- CHART DATA PREPARATION ---
  const revenueData = useMemo(() => {
    // Mocking monthly data distribution based on real total
    const total = dossiers.reduce((acc, d) => acc + (d.totalRevenue || 0), 0);
    return [
      { name: 'Jan', value: total * 0.1 },
      { name: 'Feb', value: total * 0.15 },
      { name: 'Mar', value: total * 0.12 },
      { name: 'Apr', value: total * 0.2 },
      { name: 'May', value: total * 0.18 },
      { name: 'Jun', value: total * 0.25 },
    ];
  }, [dossiers]);

  const activeShipmentsCount = dossiers.filter(d => d.status !== 'COMPLETED' && d.status !== 'CANCELLED').length;
  
  const winRateData = useMemo(() => {
    const closed = quotes.filter(q => ['ACCEPTED', 'REJECTED'].includes(q.status));
    const won = closed.filter(q => q.status === 'ACCEPTED').length;
    const rate = closed.length > 0 ? (won / closed.length) * 100 : 0;
    
    return [
      { name: 'Lost', value: 100 - rate, fill: '#f1f5f9' },
      { name: 'Won', value: rate, fill: '#3b82f6' },
    ];
  }, [quotes]);

  const winRate = winRateData[1].value;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Good Morning, Atlas
          </h1>
          <p className="text-slate-500 mt-1">
            Here's what's happening in your logistics network today.
          </p>
        </div>
      </div>

      {/* BENTO GRID */}
      <BentoGrid className="max-w-full">
        
        {/* 1. REVENUE CHART (Wide) */}
        <BentoGridItem
          className="md:col-span-2 row-span-1 bg-gradient-to-br from-white to-slate-50"
          title={
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(
                    dossiers.reduce((acc, d) => acc + (d.totalRevenue || 0), 0)
                )}
              </span>
              <span className="text-sm font-medium text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" /> +12.5%
              </span>
            </div>
          }
          description="Total projected revenue from active files."
          header={
            <div className="h-full min-h-[140px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          }
          icon={<Briefcase className="h-4 w-4 text-slate-500" />}
        />

        {/* 2. WIN RATE (Square) */}
        <BentoGridItem
          className="md:col-span-1"
          title="Quote Win Rate"
          description={`${quotes.length} total quotes generated.`}
          header={
            <div className="flex items-center justify-center h-full min-h-[120px]">
              <div className="relative">
                <ResponsiveContainer width={160} height={160}>
                    <RadialBarChart 
                        innerRadius="70%" 
                        outerRadius="100%" 
                        data={winRateData} 
                        startAngle={90} 
                        endAngle={-270}
                    >
                        <RadialBar
                            background
                            dataKey="value"
                            cornerRadius={10}
                        />
                    </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-3xl font-bold text-slate-900">{winRate.toFixed(0)}%</span>
                    <span className="text-xs text-slate-500 uppercase font-semibold">Success</span>
                </div>
              </div>
            </div>
          }
          icon={<Activity className="h-4 w-4 text-slate-500" />}
        />

        {/* 3. QUICK ACTIONS (Square / Tall) */}
        <div className="md:col-span-1 row-span-2">
            <ActionCenter />
        </div>

        {/* 4. ACTIVE SHIPMENTS (Tall) */}
        <BentoGridItem
            className="md:col-span-1 md:row-span-2"
            title="Active Operations"
            description={`${activeShipmentsCount} shipments in transit.`}
            header={
                <div className="h-full min-h-[200px] flex flex-col gap-2 mt-2">
                    {dossiers.slice(0, 4).map(d => (
                        <div key={d.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all cursor-pointer" onClick={() => navigate(`/dossiers/${d.id}`)}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-slate-700">{d.ref}</span>
                                <Badge variant="secondary" className="text-[10px] px-1.5 h-5">{d.status}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>{d.pol}</span>
                                <span className="text-slate-300 mx-1">→</span>
                                <span>{d.pod}</span>
                            </div>
                        </div>
                    ))}
                    {dossiers.length > 4 && (
                        <div className="text-center text-xs text-slate-400 mt-auto pt-2">
                            +{dossiers.length - 4} more
                        </div>
                    )}
                </div>
            }
            icon={<Ship className="h-4 w-4 text-slate-500" />}
        />

        {/* 5. RECENT QUOTES (Wide Bottom) */}
        <BentoGridItem
            className="md:col-span-2"
            title="Recent Quotes"
            description=""
            header={
                <div className="space-y-2 mt-4">
                    {quotes.slice(0, 3).map(q => (
                        <div key={q.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-md transition-colors cursor-pointer" onClick={() => navigate(`/quotes/${q.id}`)}>
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">{q.reference}</p>
                                    <p className="text-xs text-slate-500">{q.clientName || "Unknown Client"}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-slate-700">
                                    {/* @ts-ignore */}
                                    MAD {q.totalAmount?.toLocaleString() || '---'}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                    {new Date(q.validityDate).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            }
            icon={<FileText className="h-4 w-4 text-slate-500" />}
        />

      </BentoGrid>
    </div>
  );
}
import { useNavigate } from "react-router-dom";
import { 
  Briefcase, 
  FileText, 
  FileSpreadsheet, 
  Ship, 
  UserPlus,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionButtonProps {
    icon: any;
    label: string;
    description: string;
    colorClass: string;
    iconColorClass: string;
    onClick: () => void;
}

const ActionButton = ({ icon: Icon, label, description, colorClass, iconColorClass, onClick }: ActionButtonProps) => {
    return (
        <button 
            onClick={onClick}
            className="group relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-3.5 text-left transition-all hover:border-transparent hover:shadow-lg active:scale-[0.98]"
        >
            {/* Sliding Background */}
            <div className={cn(
                "absolute inset-0 translate-x-[-100%] transition-transform duration-300 ease-out group-hover:translate-x-0",
                colorClass
            )} />

            {/* Content */}
            <div className="relative flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 transition-colors group-hover:bg-white/20 group-hover:text-white",
                        iconColorClass
                    )}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="font-bold text-sm text-slate-700 group-hover:text-white transition-colors">
                            {label}
                        </div>
                        <div className="text-[10px] font-medium text-slate-400 group-hover:text-white/80 transition-colors">
                            {description}
                        </div>
                    </div>
                </div>
                
                <ArrowRight className="h-4 w-4 text-slate-300 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-white" />
            </div>
        </button>
    );
}

export function ActionCenter() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full rounded-2xl bg-slate-50/50 border border-slate-200/60 p-4 shadow-sm">
        <div className="flex items-center gap-2 px-1 mb-4">
            <div className="h-2 w-2 rounded-full bg-slate-900 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Quick Actions</h3>
        </div>

        <div className="flex-1 flex flex-col gap-3">
            {/* 1. Create Customer -> CRM Dashboard */}
            <ActionButton
                icon={Briefcase}
                label="Create Customer"
                description="Go to CRM Dashboard"
                colorClass="bg-gradient-to-r from-emerald-500 to-teal-600"
                iconColorClass="text-emerald-600"
                onClick={() => navigate('/clients')}
            />

            {/* 2. New Quote */}
            <ActionButton
                icon={FileText}
                label="New Quote"
                description="Generate pricing offer"
                colorClass="bg-gradient-to-r from-blue-500 to-indigo-600"
                iconColorClass="text-blue-600"
                onClick={() => navigate('/quotes/create')}
            />

            {/* 3. Create Tariff */}
            <ActionButton
                icon={FileSpreadsheet}
                label="Create Tariff"
                description="Update rate sheets"
                colorClass="bg-gradient-to-r from-amber-500 to-orange-600"
                iconColorClass="text-amber-600"
                onClick={() => navigate('/tariffs?action=new')}
            />

            {/* 4. New Shipment */}
            <ActionButton
                icon={Ship}
                label="New Shipment"
                description="Open new dossier"
                colorClass="bg-gradient-to-r from-violet-500 to-purple-600"
                iconColorClass="text-violet-600"
                onClick={() => navigate('/dossiers?action=new')}
            />

            {/* 5. Invite User */}
            <ActionButton
                icon={UserPlus}
                label="Invite User"
                description="Add team member"
                colorClass="bg-gradient-to-r from-pink-500 to-rose-600"
                iconColorClass="text-pink-600"
                onClick={() => navigate('/users?action=invite')}
            />
        </div>
    </div>
  );
}
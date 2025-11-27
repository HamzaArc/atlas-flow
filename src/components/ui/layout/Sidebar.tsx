import { 
  LayoutDashboard, 
  FileText, 
  Ship, 
  Settings, 
  Users, 
  Briefcase 
} from "lucide-react";
import { cn } from "@/lib/utils"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  return (
    <div className={cn("pb-12 min-h-screen border-r bg-slate-50/50", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-slate-900">
            Atlas Flow
          </h2>
          <div className="space-y-1">
            <Button variant="secondary" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Quote Engine
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Ship className="mr-2 h-4 w-4" />
              Dossiers (Ops)
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Briefcase className="mr-2 h-4 w-4" />
              Finance & Invoicing
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              CRM (Clients)
            </Button>
          </div>
        </div>
        
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Admin
          </h2>
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple internal Button wrapper to avoid circular deps with Shadcn Button if not fully set up
import { Button as ShadcnButton } from "@/components/ui/button";
function Button({ className, variant, children, ...props }: any) {
  return (
    <ShadcnButton variant={variant} className={cn("h-9", className)} {...props}>
      {children}
    </ShadcnButton>
  );
}
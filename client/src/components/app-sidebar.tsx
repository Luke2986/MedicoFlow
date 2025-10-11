import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Activity, LayoutDashboard, Users, Calendar, FileText, Settings } from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Pazienti",
    url: "/dashboard/pazienti",
    icon: Users,
  },
  {
    title: "Appuntamenti",
    url: "/dashboard/appuntamenti",
    icon: Calendar,
  },
  {
    title: "Cartella Clinica",
    url: "/dashboard/cartella-clinica",
    icon: FileText,
  },
  {
    title: "Impostazioni",
    url: "/dashboard/impostazioni",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link href="/dashboard">
          <div className="flex items-center gap-3 cursor-pointer hover-elevate active-elevate-2 p-2 rounded-md -m-2" data-testid="link-logo">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold text-sidebar-foreground text-base truncate">MedicoFlow</span>
              <span className="text-xs text-muted-foreground truncate">Gestionale Ambulatorio</span>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-2">
            Menu Principale
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 px-2 py-2 rounded-md hover-elevate active-elevate-2 cursor-pointer" data-testid="user-profile">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-primary">DM</span>
          </div>
          <div className="flex flex-col overflow-hidden flex-1 min-w-0">
            <span className="text-sm font-medium text-sidebar-foreground truncate">Dr. Mario Rossi</span>
            <span className="text-xs text-muted-foreground truncate">Medico di base</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useSite } from "../SiteContext";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  LayoutDashboard,
  MapPin,
  Navigation,
  ClipboardList,
  Users,
  Clock,
  LogOut,
  Shield,
  Menu,
  X,
  Sun,
  Moon,
  Bell,
  Search,
  User,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const MENU = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/sites", label: "Area (Sites)", icon: Navigation },
  { to: "/posts", label: "Titik Pos", icon: MapPin },
  { to: "/logs", label: "Riwayat Scan", icon: ClipboardList },
  { to: "/users", label: "Pengguna", icon: Users },
  { to: "/shifts", label: "Shift", icon: Clock },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { sites, selectedSiteId, setSelectedSiteId } = useSite();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState(() => {
    // Force dark theme as per UI guidelines
    document.documentElement.classList.add("dark");
    return "dark";
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleTheme = () => {
    // No-op or keep as dark
    setTheme("dark");
    document.documentElement.classList.add("dark");
  };

  const sidebarWidth = sidebarCollapsed ? "w-20" : "w-64";
  const mainMarginLeft = sidebarCollapsed ? "lg:ml-20" : "lg:ml-64";

  return (
    <div className="flex min-h-screen bg-saas-bg-secondary text-saas-text">
      {/* Sidebar for Desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 ${sidebarWidth} bg-saas-bg-tertiary border-r border-saas-border transform transition-all duration-200 ease-in-out lg:translate-x-0 lg:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header with collapse button */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-saas-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-saas-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-brutal-black" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <div className="font-semibold text-sm text-saas-text">
                  Patroli Satpam
                </div>
                <div className="text-xs text-saas-text-muted">Web Admin</div>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Site Filter */}
        {sites.length > 1 && !sidebarCollapsed && (
          <div className="px-3 py-4 border-b border-saas-border">
            <Select
              value={selectedSiteId}
              onValueChange={(value) => setSelectedSiteId(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Area" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {MENU.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              end={m.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 " +
                (isActive
                  ? "bg-saas-primary text-brutal-black font-semibold shadow-sm"
                  : "text-saas-text-muted hover:bg-saas-bg-secondary hover:text-saas-text")
              }
            >
              <m.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{m.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-saas-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-saas-primary/10 flex items-center justify-center text-saas-primary text-sm font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-saas-text truncate">
                  {user?.name}
                </div>
                <div className="text-xs text-saas-text-muted capitalize">
                  {user?.role}
                </div>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <Button
              variant="outline"
              className="w-full text-sm"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-1" />
              Keluar
            </Button>
          )}
          {sidebarCollapsed && (
            <Button
              variant="outline"
              size="icon"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-50"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-64 p-0" side="left">
          <div className="flex h-16 items-center justify-between px-4 border-b border-saas-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-saas-primary flex items-center justify-center">
                <Shield className="w-5 h-5 text-brutal-black" />
              </div>
              <div>
                <div className="font-semibold text-sm text-saas-text">
                  Patroli Satpam
                </div>
                <div className="text-xs text-saas-text-muted">Web Admin</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
            {MENU.map((m) => (
              <NavLink
                key={m.to}
                to={m.to}
                end={m.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 " +
                  (isActive
                    ? "bg-saas-primary text-brutal-black font-semibold shadow-sm"
                    : "text-saas-text-muted hover:bg-saas-bg-secondary hover:text-saas-text")
                }
              >
                <m.icon className="w-5 h-5 flex-shrink-0" />
                {m.label}
              </NavLink>
            ))}
          </nav>
          <div className="p-4 border-t border-saas-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-saas-primary/10 flex items-center justify-center text-saas-primary text-sm font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-saas-text truncate">
                  {user?.name}
                </div>
                <div className="text-xs text-saas-text-muted capitalize">
                  {user?.role}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full text-sm"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-1" />
              Keluar
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <main className={`flex-1 ${mainMarginLeft} min-h-screen overflow-x-hidden`}>
        <header className="sticky top-0 z-40 h-16 bg-saas-card/80 backdrop-blur-sm border-b border-saas-border flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-saas-text">
              Patroli Satpam
            </h1>
          </div>

          <div className="flex-1 max-w-md hidden lg:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-saas-text-light" />
              <input
                type="search"
                placeholder="Cari..."
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-saas-border bg-saas-bg-tertiary text-sm text-saas-text placeholder:text-saas-text-light focus:outline-none focus:ring-2 focus:ring-saas-primary/20 focus:border-saas-primary transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-saas-danger rounded-full" />
            </Button>

            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-3 py-1.5"
                >
                  <div className="w-8 h-8 rounded-full bg-saas-primary/10 flex items-center justify-center text-saas-primary text-sm font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-saas-text">
                      {user?.name}
                    </div>
                    <div className="text-xs text-saas-text-muted">
                      {user?.role}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-saas-text-muted" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-medium text-saas-text">
                  Akun
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-saas-text hover:bg-saas-bg-secondary">
                  <User className="w-4 h-4 mr-2" />
                  Profil
                </DropdownMenuItem>
                <DropdownMenuItem className="text-saas-text hover:bg-saas-bg-secondary">
                  <Settings className="w-4 h-4 mr-2" />
                  Pengaturan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-saas-danger hover:bg-saas-danger-light"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="p-4 pt-16 lg:pt-6 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

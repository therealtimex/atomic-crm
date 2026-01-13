import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { CanAccess, useGetOne, useTranslate } from "ra-core";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Database, Settings, User, Webhook } from "lucide-react";

import { useMigrationContext } from "@/contexts/MigrationContext";
import { MigrationPulseIndicator } from "@/components/atomic-crm/migration/MigrationPulseIndicator";
import { ChangelogModal } from "@/components/atomic-crm/layout/ChangelogModal";
import { LocalesMenuButton } from "@/components/admin/locales-menu-button";
import { ThemeModeToggle } from "@/components/admin/theme-mode-toggle";
import { RefreshButton } from "@/components/admin/refresh-button";
import { UserMenu } from "@/components/admin/user-menu";
import { useUserMenu } from "@/hooks/user-menu-context";

const Header = () => {
  const translate = useTranslate();
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();
  const migrationContext = useMigrationContext();

  const [darkModeLogo, setDarkModeLogo] = useState<string>("");
  const [lightModeLogo, setLightModeLogo] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [showBackButton, setShowBackButton] = useState(false);
  const [showPulseIndicator, setShowPulseIndicator] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);

  const { data: businessProfile } = useGetOne("business_profile", { id: 1 });

  useEffect(() => {
    if (businessProfile) {
      setDarkModeLogo(businessProfile.logo_dark || "/branding/logo_dark.png");
      setLightModeLogo(
        businessProfile.logo_light || "/branding/logo_light.png",
      );
      setTitle(businessProfile.company_name || "Atomic CRM");
    }
  }, [businessProfile]);

  useEffect(() => {
    // Show back button on detail views (ID/show) or create views
    const isDetailView = /\/[^/]+\/\d+(\/show)?$/.test(currentPath);
    const isCreateView = /\/[^/]+\/create$/.test(currentPath);
    setShowBackButton(isDetailView || isCreateView);
  }, [currentPath]);

  useEffect(() => {
    const checkMigrations = () => {
      if (
        migrationContext?.pendingMigrations &&
        migrationContext.pendingMigrations.length > 0
      ) {
        setShowPulseIndicator(true);
      } else {
        setShowPulseIndicator(false);
      }
    };
    checkMigrations();
  }, [migrationContext?.pendingMigrations]);

  return (
    <header className="bg-secondary fixed top-0 left-0 right-0 z-50 border-b border-border">
      <div className="px-4 sm:px-5 lg:px-6">
        <div className="flex justify-between items-center h-16 md:h-20">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden mr-2" />
            <Logo
              darkLogo={darkModeLogo}
              lightLogo={lightModeLogo}
              title={title}
            />
            <BackButton show={showBackButton} />
          </div>

          <nav className="hidden md:flex" aria-label="Main navigation">
            <NavigationTab
              label={translate("crm.nav.dashboard")}
              to="/"
              isActive={currentPath === "/"}
            />
            <NavigationTab
              label={translate("crm.nav.contacts")}
              to="/contacts"
              isActive={currentPath === "/contacts"}
            />
            <NavigationTab
              label={translate("crm.nav.companies")}
              to="/companies"
              isActive={currentPath === "/companies"}
            />
            <NavigationTab
              label={translate("crm.nav.deals")}
              to="/deals"
              isActive={currentPath === "/deals"}
            />
            <NavigationTab
              label={translate("crm.nav.invoices")}
              to="/invoices"
              isActive={currentPath === "/invoices"}
            />
            <NavigationTab
              label={translate("crm.nav.tasks")}
              to="/tasks"
              isActive={currentPath === "/tasks"}
            />
          </nav>

          <div className="flex items-center">
            {showPulseIndicator && (
              <MigrationPulseIndicator
                onClick={() => migrationContext?.openMigrationModal()}
              />
            )}
            <LocalesMenuButton />
            <ThemeModeToggle />
            <RefreshButton />
            <UserMenu>
              <ConfigurationMenu />
              <DatabaseMenu />
              <IntegrationsMenu />
              <CanAccess resource="sales" action="list">
                <UsersMenu />
              </CanAccess>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="font-normal">
                <button
                  onClick={() => setChangelogOpen(true)}
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors w-full text-left"
                >
                  Version {import.meta.env.VITE_APP_VERSION}
                </button>
              </DropdownMenuLabel>
            </UserMenu>
            <ChangelogModal
              open={changelogOpen}
              onOpenChange={setChangelogOpen}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

const Logo = ({
  darkLogo,
  lightLogo,
  title,
}: {
  darkLogo: string;
  lightLogo: string;
  title: string;
}) => (
  <Link
    to="/"
    className="flex items-center gap-2 text-secondary-foreground no-underline hover:opacity-80 transition-opacity"
  >
    <img
      className="[.light_&]:hidden h-6"
      src={darkLogo}
      alt={`${title} logo`}
    />
    <img
      className="[.dark_&]:hidden h-6"
      src={lightLogo}
      alt={`${title} logo`}
    />
    <h1 className="text-xl font-semibold">{title}</h1>
  </Link>
);

const BackButton = ({ show }: { show: boolean }) => {
  const navigate = useNavigate();
  const translate = useTranslate();

  if (!show) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate(-1)}
      className="gap-1 text-secondary-foreground/70 hover:text-secondary-foreground"
      aria-label="Go back to previous page"
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="hidden sm:inline">{translate("crm.nav.back")}</span>
    </Button>
  );
};

const NavigationTab = ({
  label,
  to,
  isActive,
}: {
  label: string;
  to: string;
  isActive: boolean;
}) => (
  <Link
    to={to}
    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${isActive
        ? "text-secondary-foreground border-secondary-foreground"
        : "text-secondary-foreground/70 border-transparent hover:text-secondary-foreground/80"
      }`}
  >
    {label}
  </Link>
);

const UsersMenu = () => {
  const userMenu = useUserMenu();
  const onClose = userMenu ? userMenu.onClose : undefined;
  const translate = useTranslate();
  return (
    <DropdownMenuItem asChild onClick={onClose}>
      <Link to="/sales" className="flex items-center gap-2">
        <User className="h-4 w-4" />
        {translate("crm.nav.users")}
      </Link>
    </DropdownMenuItem>
  );
};

const ConfigurationMenu = () => {
  const userMenu = useUserMenu();
  const onClose = userMenu ? userMenu.onClose : undefined;
  const translate = useTranslate();
  return (
    <DropdownMenuItem asChild onClick={onClose}>
      <Link to="/settings" className="flex items-center gap-2">
        <Settings className="h-4 w-4" />
        {translate("crm.nav.settings")}
      </Link>
    </DropdownMenuItem>
  );
};

const DatabaseMenu = () => {
  const userMenu = useUserMenu();
  const onClose = userMenu ? userMenu.onClose : undefined;
  const translate = useTranslate();
  return (
    <DropdownMenuItem asChild onClick={onClose}>
      <Link to="/database" className="flex items-center gap-2">
        <Database className="h-4 w-4" />
        {translate("crm.nav.database")}
      </Link>
    </DropdownMenuItem>
  );
};

const IntegrationsMenu = () => {
  const userMenu = useUserMenu();
  const onClose = userMenu ? userMenu.onClose : undefined;
  const translate = useTranslate();
  return (
    <DropdownMenuItem asChild onClick={onClose}>
      <Link to="/integrations" className="flex items-center gap-2">
        <Webhook className="h-4 w-4" />
        {translate("crm.nav.integrations")}
      </Link>
    </DropdownMenuItem>
  );
};

export default Header;

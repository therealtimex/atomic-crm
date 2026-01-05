import * as React from "react";
import { Link } from "react-router";
import { Notification } from "@/components/admin/notification";
import { useConfigurationContext } from "@/components/atomic-crm/root/ConfigurationContext";
import { ThemeModeToggle } from "@/components/admin/theme-mode-toggle";
import { LocalesMenuButton } from "@/components/admin/locales-menu-button";
import { AnimatedCircuitSVG } from "@/components/atomic-crm/misc/AnimatedCircuitSVG";

export const Layout = ({ children }: React.PropsWithChildren) => {
  const { darkModeLogo, title } = useConfigurationContext();

  return (
    <div className="min-h-screen flex">
      <div className="container relative grid flex-col items-center justify-center sm:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex overflow-hidden">
          <div className="absolute inset-0 bg-zinc-900" />
          <Link
            to="/"
            className="relative z-20 flex items-center text-lg font-medium no-underline text-white hover:opacity-80 transition-opacity"
          >
            <img className="h-6 mr-2" src={darkModeLogo} alt={title} />
            {title}
          </Link>
          <div className="relative z-10 flex-1 flex items-center justify-center">
            <AnimatedCircuitSVG />
          </div>
        </div>
        <div className="lg:p-8 relative">
          <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
            <LocalesMenuButton />
            <ThemeModeToggle />
          </div>
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            {children}
          </div>
        </div>
      </div>
      <Notification />
    </div>
  );
};

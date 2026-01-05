import * as React from "react";
import { Link } from "react-router";
import { Notification } from "@/components/admin/notification";
import { useConfigurationContext } from "@/components/atomic-crm/root/ConfigurationContext";
import { ThemeModeToggle } from "@/components/admin/theme-mode-toggle";
import { LocalesMenuButton } from "@/components/admin/locales-menu-button";
import { AnimatedCircuitSVG } from "@/components/atomic-crm/misc/AnimatedCircuitSVG";

export const Layout = ({ children }: React.PropsWithChildren) => {
  const { darkModeLogo, lightModeLogo, title } = useConfigurationContext();

  return (
    <div className="min-h-screen flex text-foreground bg-background">
      <div className="container relative grid flex-col items-center justify-center sm:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col bg-muted p-10 dark:border-r lg:flex overflow-hidden">
          <Link
            to="/"
            className="relative z-20 flex items-center text-lg font-medium no-underline text-foreground hover:opacity-80 transition-opacity"
          >
            <img className="[.dark_&]:hidden h-6 mr-2" src={lightModeLogo} alt={title} />
            <img className="[.light_&]:hidden h-6 mr-2" src={darkModeLogo} alt={title} />
            {title}
          </Link>
          <div className="relative z-10 flex-1 flex items-center justify-center">
            <AnimatedCircuitSVG />
          </div>
        </div>
        <div className="lg:p-10 relative flex flex-col h-full justify-center">
          <div className="absolute top-10 right-10 flex items-center gap-2 z-20">
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

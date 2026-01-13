import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Notification } from "@/components/admin/notification";
import { Error } from "@/components/admin/error";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/app-sidebar";

import Header from "./Header";
import { LocaleSync } from "../root/LocaleSync";

export const Layout = ({ children }: { children: ReactNode }) => (
  <SidebarProvider>
    <AppSidebar className="md:hidden" />
    <div className="w-full min-h-svh flex flex-col">
      <LocaleSync />
      <Header />
      <main
        className="w-full flex-1 pt-20 px-4 sm:px-5 lg:px-6"
        id="main-content"
      >
        <ErrorBoundary FallbackComponent={Error}>
          <Suspense fallback={<Skeleton className="h-12 w-12 rounded-full" />}>
            {children}
          </Suspense>
        </ErrorBoundary>
      </main>
      <Notification />
    </div>
  </SidebarProvider>
);

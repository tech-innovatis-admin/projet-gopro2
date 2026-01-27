"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface NotificationContextType {
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);
    // Prevent body scroll when drawer is open
    document.body.style.overflow = "hidden";
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    // Restore body scroll
    document.body.style.overflow = "";
  }, []);

  const toggleDrawer = useCallback(() => {
    if (isDrawerOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }, [isDrawerOpen, openDrawer, closeDrawer]);

  return (
    <NotificationContext.Provider
      value={{
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}

import { ReactNode } from "react";
import AppHeader from "@/components/layout/AppHeader";
interface ProtectedLayoutProps {
  children: ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <div className="flex flex-col h-full w-full">
      <AppHeader />
      <div className="flex-1 flex items-center justify-center pt-10">
        {children}
      </div>
    </div>
  );
}

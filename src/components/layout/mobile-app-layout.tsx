'use client';

import { usePathname } from 'next/navigation';
import { BottomNavigation } from './bottom-navigation';
import { MobileHeader } from './mobile-header';
import { cn } from '@/lib/utils';

interface MobileAppLayoutProps {
  children: React.ReactNode;
}

export function MobileAppLayout({ children }: MobileAppLayoutProps) {
  const pathname = usePathname();
  
  // Pages sans layout (auth, landing)
  const isAuthPage = pathname.startsWith('/auth') || pathname === '/';
  
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header Mobile */}
      <MobileHeader />
      
      {/* Contenu Principal */}
      <main className={cn(
        "pb-20 pt-16", // Espace pour header et bottom nav
        "min-h-screen"
      )}>
        <div className="container mx-auto px-2 py-4 max-w-md">
          {children}
        </div>
      </main>
      
      {/* Navigation Inférieure */}
      <BottomNavigation />
    </div>
  );
}
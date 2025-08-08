'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Home, 
  CreditCard, 
  Target, 
  BarChart3, 
  User,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  isActive?: boolean;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Accueil", href: "/dashboard" },
  { icon: CreditCard, label: "Transactions", href: "/transactions" },
  { icon: Target, label: "Épargne", href: "/savings" },
  { icon: BarChart3, label: "Rapports", href: "/reports" },
  { icon: User, label: "Profil", href: "/profile" }
];

export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  // Ne pas afficher la navigation sur les pages d'auth
  if (pathname.startsWith('/auth') || pathname === '/') {
    return null;
  }

  const handleNavigation = (href: string, label: string) => {
    console.log(`🧭 Navigation vers ${label} (${href})`);
    router.push(href);
  };

  const handleQuickAdd = () => {
    console.log('➕ Ouverture du menu d\'ajout rapide');
    router.push('/transactions/add');
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-50">
        <Button
          onClick={handleQuickAdd}
          size="lg"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg",
            "bg-blue-600 hover:bg-blue-700 text-white",
            "transform transition-all duration-300 ease-out",
            "hover:scale-110 active:scale-95",
            "touch-target"
          )}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-40",
        "bg-white/95 backdrop-blur-md border-t border-gray-200",
        "dark:bg-gray-900/95 dark:border-gray-800",
        "bottom-nav-safe"
      )}>
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            
            const Icon = item.icon;
            
            return (
              <Button
                key={item.href}
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation(item.href, item.label)}
                className={cn(
                  "flex flex-col items-center justify-center",
                  "h-16 w-16 p-1 rounded-lg",
                  "transition-all duration-200 ease-out",
                  "touch-target",
                  isActive 
                    ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/50" 
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 mb-1 transition-transform duration-200",
                  isActive && "scale-110"
                )} />
                <span className={cn(
                  "text-xs font-medium leading-none",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>
                
                {/* Indicateur actif */}
                {isActive && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                    <div className="w-1 h-1 bg-blue-600 rounded-full dark:bg-blue-400" />
                  </div>
                )}
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Spacer pour éviter que le contenu soit caché */}
      <div className="h-20" />
    </>
  );
}
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Bell, 
  Settings, 
  Eye, 
  EyeOff,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const pageConfig: Record<string, { title: string; showBack?: boolean; actions?: string[] }> = {
  '/dashboard': { 
    title: 'Budget Manager', 
    actions: ['notifications', 'visibility'] 
  },
  '/transactions': { 
    title: 'Transactions', 
    showBack: true,
    actions: ['filter'] 
  },
  '/transactions/add': { 
    title: 'Nouvelle Transaction', 
    showBack: true 
  },
  '/savings': { 
    title: 'Épargne', 
    showBack: true,
    actions: ['add'] 
  },
  '/reports': { 
    title: 'Rapports', 
    showBack: true,
    actions: ['export'] 
  },
  '/profile': { 
    title: 'Profil', 
    showBack: true,
    actions: ['settings'] 
  }
};

export function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [showBalances, setShowBalances] = useState(true);
  
  const config = pageConfig[pathname] || { title: 'Budget Manager' };
  
  const handleBack = () => {
    console.log('⬅️ Navigation retour');
    router.back();
  };

  const handleNotifications = () => {
    console.log('🔔 Ouverture des notifications');
    // TODO: Implémenter les notifications
  };

  const toggleVisibility = () => {
    setShowBalances(!showBalances);
    console.log(`👁️ Visibilité des soldes: ${!showBalances ? 'visible' : 'masqué'}`);
    // TODO: Persister la préférence
  };

  const handleSettings = () => {
    console.log('⚙️ Ouverture des paramètres');
    router.push('/settings');
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50",
      "bg-white/95 backdrop-blur-md border-b border-gray-200",
      "dark:bg-gray-900/95 dark:border-gray-800",
      "safe-area-top"
    )}>
      <div className="flex items-center justify-between px-4 h-16">
        {/* Bouton Retour ou Menu */}
        <div className="flex items-center">
          {config.showBack ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="touch-target"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <div className="w-10" /> // Spacer
          )}
        </div>

        {/* Titre */}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
            {config.title}
          </h1>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1">
          {config.actions?.includes('notifications') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNotifications}
              className="touch-target relative"
            >
              <Bell className="h-5 w-5" />
              {/* Badge de notification */}
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>
          )}
          
          {config.actions?.includes('settings') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSettings}
              className="touch-target"
            >
              <Settings className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
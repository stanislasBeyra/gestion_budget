'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, Target, Shield, Smartphone, Zap } from 'lucide-react';

interface SessionData {
  userId: string;
  sessionId: string;
  loginTime: Date;
  expiresAt: Date;
  isActive: boolean;
}

interface StorageData {
  sessions?: SessionData[];
}

export default function HomePage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Vérifier si c'est un appareil mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      
      setIsMobile(isMobileDevice || isSmallScreen);
      
      // Rediriger les utilisateurs desktop
      if (!isMobileDevice && !isSmallScreen) {
        // Afficher un message ou rediriger
        console.log('Cette application est conçue pour les appareils mobiles');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Vérifier s'il y a une session active
  useEffect(() => {
    const checkSession = () => {
      try {
        const storageData = localStorage.getItem('budget_app_v2');
        if (storageData) {
          const data: StorageData = JSON.parse(storageData);
          const activeSessions = data.sessions?.filter((session: SessionData) => 
            session.isActive && new Date(session.expiresAt) > new Date()
          );
          
          if (activeSessions && activeSessions.length > 0) {
            router.push('/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de session:', error);
      }
    };

    checkSession();
  }, [router]);

  if (!isMobile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Smartphone className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <CardTitle>Application Mobile Uniquement</CardTitle>
            <CardDescription>
              Cette application PWA est conçue exclusivement pour les smartphones. 
              Veuillez l'ouvrir sur votre appareil mobile.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Scannez le QR code ou visitez cette URL sur votre smartphone pour accéder à l'application.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="px-4 py-6">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Budget PWA</h1>
              <p className="text-sm text-gray-600">Gestion financière intelligente</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-4 pb-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Prenez le contrôle de vos finances
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Une application PWA complète pour gérer votre budget, épargne et objectifs financiers
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Suivi en temps réel</h3>
                  <p className="text-sm text-gray-600">Visualisez vos revenus et dépenses instantanément</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Objectifs d&apos;épargne</h3>
                  <p className="text-sm text-gray-600">Définissez et atteignez vos objectifs financiers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Sécurité locale</h3>
                  <p className="text-sm text-gray-600">Vos données restent sur votre appareil</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Mode hors ligne</h3>
                  <p className="text-sm text-gray-600">Fonctionne sans connexion internet</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={() => router.push('/auth/login')}
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 touch-target"
          >
            Se connecter
          </Button>
          
          <Button 
            onClick={() => router.push('/auth/register')}
            variant="outline" 
            className="w-full h-12 text-lg font-semibold border-2 touch-target"
          >
            Créer un compte
          </Button>
        </div>

        {/* PWA Install Hint */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            💡 Ajoutez cette app à votre écran d'accueil pour une expérience optimale
          </p>
        </div>
      </main>
    </div>
  );
}

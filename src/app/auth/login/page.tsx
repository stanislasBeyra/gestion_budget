'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Eye, EyeOff, Wallet } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  lastLogin?: Date;
}

interface Session {
  userId: string;
  sessionId: string;
  loginTime: Date;
  expiresAt: Date;
  isActive: boolean;
}

interface StorageData {
  users: User[];
  sessions: Session[];
}

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 Tentative de connexion pour:', formData.username);
      
      const storageData = localStorage.getItem('budget_app_v2');
      
      if (!storageData) {
        console.error('❌ Aucune donnée trouvée dans localStorage');
        setError('Aucun compte trouvé. Veuillez créer un compte.');
        setIsLoading(false);
        return;
      }

      const data: StorageData = JSON.parse(storageData);
      const users = data.users || [];
      console.log('👥 Nombre d&apos;utilisateurs trouvés:', users.length);

      // Trouver l'utilisateur
      const user = users.find((u: User) => 
        u.username === formData.username || u.email === formData.username
      );

      if (!user) {
        console.error('❌ Utilisateur non trouvé:', formData.username);
        setError('Nom d&apos;utilisateur ou email incorrect.');
        setIsLoading(false);
        return;
      }

      console.log('✅ Utilisateur trouvé:', {
        id: user.id,
        username: user.username,
        email: user.email,
        isActive: user.isActive
      });

      // Vérifier le mot de passe (ici on simule, dans un vrai cas il faudrait hasher)
      if (user.passwordHash !== btoa(formData.password)) {
        console.error('❌ Mot de passe incorrect pour:', user.username);
        setError('Mot de passe incorrect.');
        setIsLoading(false);
        return;
      }

      if (!user.isActive) {
        console.error('❌ Compte désactivé:', user.username);
        setError('Ce compte est désactivé.');
        setIsLoading(false);
        return;
      }

      console.log('🎫 Création de la session...');
      // Créer une session
      const sessionId = uuidv4();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (formData.rememberMe ? 24 * 7 : 24)); // 7 jours si "se souvenir", sinon 24h

      const session: Session = {
        userId: user.id,
        sessionId,
        loginTime: new Date(),
        expiresAt,
        isActive: true
      };

      console.log('📝 Session créée:', {
        sessionId,
        userId: user.id,
        expiresAt: expiresAt.toISOString(),
        duration: formData.rememberMe ? '7 jours' : '24 heures'
      });

      // Mettre à jour les données
      data.sessions = data.sessions || [];
      data.sessions.push(session);
      
      // Mettre à jour lastLogin de l'utilisateur
      user.lastLogin = new Date();

      console.log('💾 Sauvegarde des données...');
      localStorage.setItem('budget_app_v2', JSON.stringify(data));

      console.log('🎉 Connexion réussie! Redirection vers le dashboard...');
      console.log('📊 Sessions actives:', data.sessions.filter((s: Session) => s.isActive).length);

      // Rediriger vers le dashboard
      router.push('/dashboard');

    } catch (error) {
      console.error('💥 Erreur de connexion:', error);
      setError('Une erreur est survenue lors de la connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="touch-target"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center space-x-2">
          <Wallet className="w-6 h-6 text-blue-600" />
          <span className="font-semibold text-gray-900">Budget PWA</span>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Connexion</CardTitle>
            <CardDescription>
              Connectez-vous à votre compte pour accéder à vos finances
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Nom d&apos;utilisateur ou Email</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Entrez votre nom d&apos;utilisateur ou email"
                  required
                  className="touch-target"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Entrez votre mot de passe"
                    required
                    className="touch-target pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 touch-target"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, rememberMe: checked as boolean }))
                  }
                />
                <Label htmlFor="rememberMe" className="text-sm">
                  Se souvenir de moi
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full touch-target"
                disabled={isLoading}
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Pas encore de compte ?{' '}
                <Link 
                  href="/auth/register" 
                  className="text-blue-600 hover:underline font-medium"
                >
                  Créer un compte
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
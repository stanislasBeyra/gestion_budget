'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Eye, EyeOff, Wallet } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { RegisterForm, User, Currency } from '@/types';

interface SessionData {
  userId: string;
  sessionId: string;
  loginTime: Date;
  expiresAt: Date;
  isActive: boolean;
}

interface StorageData {
  users: User[];
  sessions: SessionData[];
  userData: Record<string, {
    accounts: unknown[];
    transactions: unknown[];
    savingsGoals: unknown[];
    budgets: unknown[];
    categories: unknown[];
  }>;
  settings: {
    appVersion: string;
    defaultCurrency: Currency;
    sessionTimeout: number;
  };
  metadata: {
    version: string;
    lastBackup: string;
    totalUsers: number;
    createdAt: string;
  };
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterForm>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    console.log('🔍 Validation du formulaire d\'inscription...');
    
    if (formData.password !== formData.confirmPassword) {
      console.error('❌ Erreur: Les mots de passe ne correspondent pas');
      setError('Les mots de passe ne correspondent pas.');
      return false;
    }

    if (formData.password.length < 6) {
      console.error('❌ Erreur: Mot de passe trop court');
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      console.error('❌ Erreur: Email invalide');
      setError('Veuillez entrer une adresse email valide.');
      return false;
    }

    if (formData.username.length < 3) {
      console.error('❌ Erreur: Nom d\'utilisateur trop court');
      setError('Le nom d\'utilisateur doit contenir au moins 3 caractères.');
      return false;
    }

    console.log('✅ Validation réussie');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    console.log('🚀 Début de la création de compte...');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('📦 Récupération des données localStorage...');
      // Récupérer ou initialiser les données du localStorage
      const storageData = localStorage.getItem('budget_app_v2');
      const data: StorageData = storageData ? JSON.parse(storageData) : {
        users: [],
        sessions: [],
        userData: {},
        settings: {
          appVersion: '2.0.0',
          defaultCurrency: currency,
          sessionTimeout: 24 * 60 * 60 * 1000 // 24 heures
        },
        metadata: {
          version: '2.0.0',
          lastBackup: new Date().toISOString(),
          totalUsers: 0,
          createdAt: new Date().toISOString()
        }
      };

      console.log('👥 Vérification de l\'existence de l\'utilisateur...');
      // Vérifier si l'utilisateur existe déjà
      const existingUser = data.users.find((u: User) => 
        u.username === formData.username || u.email === formData.email
      );

      if (existingUser) {
        console.error('❌ Utilisateur déjà existant:', existingUser.username);
        setError('Un compte avec ce nom d\'utilisateur ou cette adresse email existe déjà.');
        setIsLoading(false);
        return;
      }

      console.log('🆔 Génération des IDs...');
      // Créer le nouvel utilisateur
      const userId = uuidv4();
      console.log('👤 ID utilisateur généré:', userId);
      
      const newUser: User = {
        id: userId,
        username: formData.username,
        email: formData.email,
        passwordHash: btoa(formData.password), // Simple encoding (à améliorer en production)
        firstName: formData.firstName,
        lastName: formData.lastName,
        preferences: {
          currency,
          language: 'fr',
          theme: 'light',
          notifications: true
        },
        createdAt: new Date(),
        lastLogin: new Date(),
        isActive: true
      };

      console.log('✅ Utilisateur créé:', {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        currency: newUser.preferences.currency
      });

      // Ajouter l'utilisateur
      data.users.push(newUser);

      console.log('🏦 Création du compte principal...');
      const accountId = uuidv4();
      console.log('💳 ID compte généré:', accountId);

      // Initialiser les données utilisateur
      data.userData[userId] = {
        accounts: [
          {
            id: accountId,
            userId,
            name: 'Compte Principal',
            type: 'main',
            balance: 0,
            currency,
            createdAt: new Date(),
            lastUpdated: new Date()
          }
        ],
        transactions: [],
        savingsGoals: [],
        budgets: [],
        categories: [] // Les catégories par défaut seront ajoutées plus tard
      };

      console.log('🔐 Création de la session...');
      // Créer une session
      const sessionId = uuidv4();
      console.log('🎫 ID session généré:', sessionId);
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const session: SessionData = {
        userId,
        sessionId,
        loginTime: new Date(),
        expiresAt,
        isActive: true
      };

      data.sessions.push(session);
      data.metadata.totalUsers = data.users.length;

      console.log('💾 Sauvegarde dans localStorage...');
      // Sauvegarder dans localStorage
      localStorage.setItem('budget_app_v2', JSON.stringify(data));
      
      console.log('🎉 Compte créé avec succès! Redirection vers le dashboard...');
      console.log('📊 Statistiques:', {
        totalUsers: data.metadata.totalUsers,
        sessionsActives: data.sessions.filter((s: SessionData) => s.isActive).length
      });

      // Rediriger vers le dashboard
      router.push('/dashboard');

    } catch (error) {
      console.error('💥 Erreur lors de l\'inscription:', error);
      setError('Une erreur est survenue lors de la création du compte.');
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
            <CardTitle className="text-2xl">Créer un compte</CardTitle>
            <CardDescription>
              Rejoignez Budget PWA pour gérer vos finances
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Prénom"
                    required
                    className="touch-target"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Nom"
                    required
                    className="touch-target"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Nom d&apos;utilisateur</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Nom d&apos;utilisateur unique"
                  required
                  className="touch-target"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="votre@email.com"
                  required
                  className="touch-target"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Devise préférée</Label>
                <Select value={currency} onValueChange={(value: Currency) => setCurrency(value)}>
                  <SelectTrigger className="touch-target">
                    <SelectValue placeholder="Choisir une devise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="USD">Dollar US (USD)</SelectItem>
                    <SelectItem value="XOF">Franc CFA (XOF)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Au moins 6 caractères"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Répétez votre mot de passe"
                    required
                    className="touch-target pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 touch-target"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full touch-target"
                disabled={isLoading}
              >
                {isLoading ? 'Création...' : 'Créer mon compte'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Déjà un compte ?{' '}
                <Link 
                  href="/auth/login" 
                  className="text-blue-600 hover:underline font-medium"
                >
                  Se connecter
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
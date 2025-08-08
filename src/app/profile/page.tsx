'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
    User as UserIcon,
    Settings,
    Bell,
    Globe,
    Palette,
    Shield,
    Download,
    Upload,
    Trash2,
    LogOut,
    Edit,
    Save,
    X,
    Camera
} from 'lucide-react';
import { User, Currency, Language, Theme } from '@/types';

interface ProfilePageData {
    user: User;
    totalTransactions: number;
    totalAccounts: number;
    totalSavingsGoals: number;
    memberSince: string;
}

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
}

interface ProfileFormData {
    firstName: string;
    lastName: string;
    email: string;
    currency: Currency;
    language: Language;
    theme: Theme;
    notifications: boolean;
}

export default function ProfilePage() {
    const router = useRouter();
    const [profileData, setProfileData] = useState<ProfilePageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<ProfileFormData>({
        firstName: '',
        lastName: '',
        email: '',
        currency: 'EUR',
        language: 'fr',
        theme: 'light',
        notifications: true
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadProfileData();
    }, []);

    const loadProfileData = async () => {
        try {
            console.log('👤 Chargement du profil utilisateur...');
            
            const storageData = localStorage.getItem('budget_app_v2');
            if (!storageData) {
                console.log('❌ Aucune donnée trouvée, redirection vers connexion');
                router.push('/auth/login');
                return;
            }

            const data: StorageData = JSON.parse(storageData);
            const activeSession = data.sessions?.find((s: SessionData) => s.isActive);
            
            if (!activeSession) {
                console.log('❌ Aucune session active, redirection vers connexion');
                router.push('/auth/login');
                return;
            }

            const user = data.users?.find((u: User) => u.id === activeSession.userId);
            const userData = data.userData?.[activeSession.userId];

            if (!user || !userData) {
                console.log('❌ Données utilisateur introuvables');
                router.push('/auth/login');
                return;
            }

            const profileData: ProfilePageData = {
                user,
                totalTransactions: userData.transactions?.length || 0,
                totalAccounts: userData.accounts?.length || 0,
                totalSavingsGoals: userData.savingsGoals?.length || 0,
                memberSince: new Date(user.createdAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long'
                })
            };

            // Initialiser le formulaire avec les données utilisateur
            setFormData({
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                currency: user.preferences.currency,
                language: user.preferences.language,
                theme: user.preferences.theme,
                notifications: user.preferences.notifications
            });

            console.log('✅ Données de profil chargées:', {
                user: user.username,
                transactions: profileData.totalTransactions,
                accounts: profileData.totalAccounts,
                savingsGoals: profileData.totalSavingsGoals
            });

            setProfileData(profileData);
        } catch (error) {
            console.error('❌ Erreur lors du chargement du profil:', error);
            router.push('/auth/login');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'Le prénom est requis';
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Le nom est requis';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'L&apos;email est requis';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Format d&apos;email invalide';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm() || !profileData) return;

        setSaving(true);
        console.log('💾 Sauvegarde du profil:', formData);

        try {
            const storageData = localStorage.getItem('budget_app_v2');
            if (!storageData) throw new Error('Données non trouvées');

            const data: StorageData = JSON.parse(storageData);
            const activeSession = data.sessions?.find((s: SessionData) => s.isActive);
            
            if (!activeSession) throw new Error('Session non trouvée');

            // Mettre à jour les données utilisateur
            const userIndex = data.users.findIndex((u: User) => u.id === activeSession.userId);
            if (userIndex !== -1) {
                data.users[userIndex] = {
                    ...data.users[userIndex],
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                    email: formData.email.trim(),
                    preferences: {
                        currency: formData.currency,
                        language: formData.language,
                        theme: formData.theme,
                        notifications: formData.notifications
                    }
                };
            }

            // Sauvegarder
            localStorage.setItem('budget_app_v2', JSON.stringify(data));

            console.log('✅ Profil mis à jour avec succès');
            
            // Recharger les données
            loadProfileData();
            setEditing(false);
            
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde:', error);
            setErrors({ submit: 'Erreur lors de la sauvegarde' });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        console.log('🚪 Déconnexion de l&apos;utilisateur');
        
        try {
            const storageData = localStorage.getItem('budget_app_v2');
            if (storageData) {
                const data: StorageData = JSON.parse(storageData);
                // Désactiver toutes les sessions
                data.sessions = data.sessions.map((s: SessionData) => ({ ...s, isActive: false }));
                localStorage.setItem('budget_app_v2', JSON.stringify(data));
            }
        } catch (error) {
            console.error('❌ Erreur lors de la déconnexion:', error);
        }
        
        router.push('/auth/login');
    };

    const exportData = () => {
        console.log('📤 Export des données utilisateur');
        
        try {
            const storageData = localStorage.getItem('budget_app_v2');
            if (!storageData || !profileData) return;

            const data: StorageData = JSON.parse(storageData);
            const activeSession = data.sessions?.find((s: SessionData) => s.isActive);
            
            if (!activeSession) return;

            const userData = data.userData[activeSession.userId];
            const exportData = {
                user: profileData.user,
                accounts: userData.accounts || [],
                transactions: userData.transactions || [],
                savingsGoals: userData.savingsGoals || [],
                budgets: userData.budgets || [],
                exportDate: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `budget-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('✅ Données exportées avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l&apos;export:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <UserIcon className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-pulse" />
                    <p className="text-gray-600">Chargement du profil...</p>
                </div>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <UserIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">Erreur lors du chargement du profil</p>
                    <Button onClick={() => router.push('/dashboard')}>
                        Retour au tableau de bord
                    </Button>
                </div>
            </div>
        );
    }

    const { user } = profileData;

    return (
        <div className="space-y-4 pb-4">
            {/* En-tête */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-gray-900 truncate">Profil</h1>
                <Button
                    variant={editing ? "outline" : "default"}
                    onClick={() => editing ? setEditing(false) : setEditing(true)}
                    size="sm"
                    className="shrink-0"
                >
                    {editing ? <X className="w-4 h-4 mr-1" /> : <Edit className="w-4 h-4 mr-1" />}
                    {editing ? 'Annuler' : 'Modifier'}
                </Button>
            </div>

            {/* Informations utilisateur */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                        <div className="relative shrink-0">
                            <Avatar className="w-16 h-16">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback className="text-sm font-medium">
                                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            {editing && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="absolute -bottom-1 -right-1 h-6 w-6 p-0 rounded-full"
                                >
                                    <Camera className="w-3 h-3" />
                                </Button>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-semibold text-gray-900 truncate">
                                {user.firstName} {user.lastName}
                            </h2>
                            <p className="text-gray-600 text-sm truncate">@{user.username}</p>
                            <p className="text-xs text-gray-500 mb-2">Membre depuis {profileData.memberSince}</p>
                            
                            {/* Stats en grille compacte */}
                            <div className="grid grid-cols-3 gap-1">
                                <Badge variant="secondary" className="text-xs px-1 py-0.5 justify-center">
                                    <span className="truncate">{profileData.totalTransactions} trans.</span>
                                </Badge>
                                <Badge variant="secondary" className="text-xs px-1 py-0.5 justify-center">
                                    <span className="truncate">{profileData.totalAccounts} comptes</span>
                                </Badge>
                                <Badge variant="secondary" className="text-xs px-1 py-0.5 justify-center">
                                    <span className="truncate">{profileData.totalSavingsGoals} obj.</span>
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Informations personnelles */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-base">
                        <UserIcon className="w-4 h-4" />
                        <span>Informations personnelles</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label htmlFor="firstName" className="text-sm">Prénom</Label>
                            <Input
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                disabled={!editing}
                                className={`text-sm ${errors.firstName ? 'border-red-500' : ''}`}
                            />
                            {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                        </div>
                        
                        <div className="space-y-1">
                            <Label htmlFor="lastName" className="text-sm">Nom</Label>
                            <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                disabled={!editing}
                                className={`text-sm ${errors.lastName ? 'border-red-500' : ''}`}
                            />
                            {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                        </div>
                        
                        <div className="space-y-1">
                            <Label htmlFor="email" className="text-sm">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                disabled={!editing}
                                className={`text-sm ${errors.email ? 'border-red-500' : ''}`}
                            />
                            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Préférences */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-base">
                        <Settings className="w-4 h-4" />
                        <span>Préférences</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="currency" className="text-sm">Devise</Label>
                            <Select 
                                value={formData.currency} 
                                onValueChange={(value: Currency) => setFormData(prev => ({ ...prev, currency: value }))}
                                disabled={!editing}
                            >
                                <SelectTrigger className="text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="XOF">XOF</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="language" className="text-sm">Langue</Label>
                            <Select 
                                value={formData.language} 
                                onValueChange={(value: Language) => setFormData(prev => ({ ...prev, language: value }))}
                                disabled={!editing}
                            >
                                <SelectTrigger className="text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fr">Français</SelectItem>
                                    <SelectItem value="en">English</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex items-center justify-between py-2">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <Palette className="w-4 h-4 shrink-0" />
                                <div className="min-w-0">
                                    <Label className="text-sm">Thème</Label>
                                    <p className="text-xs text-gray-500 truncate">Apparence de l'app</p>
                                </div>
                            </div>
                            <Select 
                                value={formData.theme} 
                                onValueChange={(value: Theme) => setFormData(prev => ({ ...prev, theme: value }))}
                                disabled={!editing}
                            >
                                <SelectTrigger className="w-20 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="light">Clair</SelectItem>
                                    <SelectItem value="dark">Sombre</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <Bell className="w-4 h-4 shrink-0" />
                                <div className="min-w-0">
                                    <Label className="text-sm">Notifications</Label>
                                    <p className="text-xs text-gray-500 truncate">Notifications push</p>
                                </div>
                            </div>
                            <Switch
                                checked={formData.notifications}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notifications: checked }))}
                                disabled={!editing}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-base">
                        <Shield className="w-4 h-4" />
                        <span>Actions</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                    <Button
                        variant="outline"
                        onClick={exportData}
                        className="w-full justify-start text-sm h-9"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Exporter mes données
                    </Button>
                    
                    <Button
                        variant="outline"
                        className="w-full justify-start text-sm h-9"
                        disabled
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Importer des données
                    </Button>
                    
                    <Button
                        variant="outline"
                        className="w-full justify-start text-sm h-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer mon compte
                    </Button>
                </CardContent>
            </Card>

            {/* Boutons d&apos;action */}
            {editing && (
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setEditing(false);
                            setFormData({
                                firstName: user.firstName,
                                lastName: user.lastName,
                                email: user.email,
                                currency: user.preferences.currency,
                                language: user.preferences.language,
                                theme: user.preferences.theme,
                                notifications: user.preferences.notifications
                            });
                            setErrors({});
                        }}
                        className="flex-1 text-sm h-9"
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 text-sm h-9"
                    >
                        <Save className="w-4 h-4 mr-1" />
                        {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </Button>
                </div>
            )}

            {/* Erreur générale */}
            {errors.submit && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-3">
                        <p className="text-red-600 text-sm">{errors.submit}</p>
                    </CardContent>
                </Card>
            )}

            {/* Déconnexion */}
            <Card className="border-red-200">
                <CardContent className="p-3">
                    <Button
                        variant="outline"
                        onClick={handleLogout}
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-sm h-9"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Se déconnecter
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
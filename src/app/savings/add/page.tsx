'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
    ArrowLeft,
    Target,
    Calendar,
    DollarSign,
    TrendingUp,
    Zap,
    Home,
    Car,
    Plane,
    Gift,
    Smartphone,
    GraduationCap,
    Heart,
    Star,
    ShieldIcon
} from 'lucide-react';
import { User, Account, Priority, TransferFrequency } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface AddSavingsGoalPageData {
    user: User;
    accounts: Account[];
}

interface SavingsGoalForm {
    name: string;
    description: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: Date;
    priority: Priority;
    category: string;
    autoTransferAmount: number;
    autoTransferFrequency: TransferFrequency;
    sourceAccount: string;
}

const goalCategories = [
    { id: 'emergency', name: 'Fonds d\'urgence', icon: ShieldIcon, color: 'bg-red-100 text-red-600' },
    { id: 'vacation', name: 'Vacances', icon: Plane, color: 'bg-blue-100 text-blue-600' },
    { id: 'house', name: 'Logement', icon: Home, color: 'bg-green-100 text-green-600' },
    { id: 'car', name: 'Véhicule', icon: Car, color: 'bg-purple-100 text-purple-600' },
    { id: 'education', name: 'Éducation', icon: GraduationCap, color: 'bg-yellow-100 text-yellow-600' },
    { id: 'technology', name: 'Technologie', icon: Smartphone, color: 'bg-indigo-100 text-indigo-600' },
    { id: 'gift', name: 'Cadeau', icon: Gift, color: 'bg-pink-100 text-pink-600' },
    { id: 'health', name: 'Santé', icon: Heart, color: 'bg-rose-100 text-rose-600' },
    { id: 'other', name: 'Autre', icon: Star, color: 'bg-gray-100 text-gray-600' }
];

export default function AddSavingsGoalPage() {
    const router = useRouter();
    const [pageData, setPageData] = useState<AddSavingsGoalPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState<SavingsGoalForm>({
        name: '',
        description: '',
        targetAmount: 0,
        currentAmount: 0,
        targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an par défaut
        priority: 'medium',
        category: '',
        autoTransferAmount: 0,
        autoTransferFrequency: 'monthly',
        sourceAccount: ''
    });
    
    const [enableAutoTransfer, setEnableAutoTransfer] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        console.log('🎯 Chargement de la page de création d\'objectif');
        loadPageData();
    }, []);

    const loadPageData = () => {
        try {
            const storageData = localStorage.getItem('budget_app_v2');
            if (!storageData) {
                console.log('❌ Aucune donnée trouvée, redirection vers connexion');
                router.push('/auth/login');
                return;
            }

            const data = JSON.parse(storageData);
            const activeSession = data.sessions?.find((s: any) => s.isActive);
            
            if (!activeSession) {
                console.log('❌ Aucune session active, redirection vers connexion');
                router.push('/auth/login');
                return;
            }

            const user = data.users?.find((u: any) => u.id === activeSession.userId);
            const userData = data.userData?.[activeSession.userId];

            if (!user || !userData) {
                console.log('❌ Données utilisateur introuvables');
                router.push('/auth/login');
                return;
            }

            const pageData: AddSavingsGoalPageData = {
                user,
                accounts: userData.accounts || []
            };

            // Définir le compte par défaut
            if (pageData.accounts.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    sourceAccount: pageData.accounts[0].id
                }));
            }

            console.log('✅ Données de la page chargées:', {
                accounts: pageData.accounts.length
            });

            setPageData(pageData);
        } catch (error) {
            console.error('❌ Erreur lors du chargement:', error);
            router.push('/auth/login');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Le nom de l\'objectif est requis';
        }

        if (formData.targetAmount <= 0) {
            newErrors.targetAmount = 'Le montant cible doit être supérieur à 0';
        }

        if (formData.currentAmount < 0) {
            newErrors.currentAmount = 'Le montant actuel ne peut pas être négatif';
        }

        if (formData.currentAmount > formData.targetAmount) {
            newErrors.currentAmount = 'Le montant actuel ne peut pas dépasser le montant cible';
        }

        if (!formData.category) {
            newErrors.category = 'La catégorie est requise';
        }

        if (formData.targetDate <= new Date()) {
            newErrors.targetDate = 'La date cible doit être dans le futur';
        }

        if (enableAutoTransfer) {
            if (formData.autoTransferAmount <= 0) {
                newErrors.autoTransferAmount = 'Le montant de virement automatique doit être supérieur à 0';
            }
            if (!formData.sourceAccount) {
                newErrors.sourceAccount = 'Le compte source est requis pour les virements automatiques';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const calculateMonthsToGoal = (): number => {
        if (!enableAutoTransfer || formData.autoTransferAmount <= 0) return 0;
        
        const remaining = formData.targetAmount - formData.currentAmount;
        if (remaining <= 0) return 0;
        
        const monthlyAmount = formData.autoTransferFrequency === 'weekly' 
            ? formData.autoTransferAmount * 4.33 
            : formData.autoTransferAmount;
            
        return Math.ceil(remaining / monthlyAmount);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm() || !pageData) return;

        setSaving(true);
        console.log('💾 Sauvegarde de l\'objectif d\'épargne:', formData);

        try {
            const storageData = localStorage.getItem('budget_app_v2');
            if (!storageData) throw new Error('Données non trouvées');

            const data = JSON.parse(storageData);
            const activeSession = data.sessions?.find((s: any) => s.isActive);
            
            if (!activeSession) throw new Error('Session non trouvée');

            // Créer le nouvel objectif
            const newSavingsGoal = {
                id: uuidv4(),
                userId: activeSession.userId,
                name: formData.name.trim(),
                description: formData.description.trim(),
                targetAmount: formData.targetAmount,
                currentAmount: formData.currentAmount,
                targetDate: formData.targetDate,
                priority: formData.priority,
                category: formData.category,
                autoTransferAmount: enableAutoTransfer ? formData.autoTransferAmount : 0,
                autoTransferFrequency: formData.autoTransferFrequency,
                isCompleted: formData.currentAmount >= formData.targetAmount,
                createdAt: new Date()
            };

            // Ajouter l'objectif
            const userData = data.userData[activeSession.userId];
            if (!userData.savingsGoals) userData.savingsGoals = [];
            userData.savingsGoals.push(newSavingsGoal);

            // Si il y a un montant initial, créer une transaction
            if (formData.currentAmount > 0 && formData.sourceAccount) {
                const initialTransaction = {
                    id: uuidv4(),
                    userId: activeSession.userId,
                    type: 'savings',
                    amount: formData.currentAmount,
                    description: `Dépôt initial pour ${formData.name}`,
                    category: 'Épargne',
                    fromAccount: formData.sourceAccount,
                    date: new Date(),
                    isRecurring: false,
                    tags: ['épargne', 'objectif'],
                    createdAt: new Date()
                };

                if (!userData.transactions) userData.transactions = [];
                userData.transactions.push(initialTransaction);

                // Mettre à jour le solde du compte source
                const sourceAccount = userData.accounts.find((a: Account) => a.id === formData.sourceAccount);
                if (sourceAccount) {
                    sourceAccount.balance -= formData.currentAmount;
                    sourceAccount.lastUpdated = new Date();
                }
            }

            // Sauvegarder
            localStorage.setItem('budget_app_v2', JSON.stringify(data));

            console.log('✅ Objectif d\'épargne créé avec succès:', newSavingsGoal.id);
            
            // Rediriger vers la page d'épargne
            router.push('/savings');
            
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde:', error);
            setErrors({ submit: 'Erreur lors de la sauvegarde' });
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Target className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-pulse" />
                    <p className="text-gray-600">Chargement...</p>
                </div>
            </div>
        );
    }

    if (!pageData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">Erreur lors du chargement</p>
                    <Button onClick={() => router.push('/savings')}>
                        Retour aux objectifs
                    </Button>
                </div>
            </div>
        );
    }

    const { user, accounts } = pageData;
    const progress = formData.targetAmount > 0 ? (formData.currentAmount / formData.targetAmount) * 100 : 0;
    const monthsToGoal = calculateMonthsToGoal();

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex items-center space-x-3">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="p-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">Nouvel Objectif d'Épargne</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informations de base */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Informations de base</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Nom */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom de l'objectif *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Ex: Vacances d'été, Nouveau téléphone..."
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Décrivez votre objectif d'épargne..."
                                rows={3}
                            />
                        </div>

                        {/* Catégorie */}
                        <div className="space-y-2">
                            <Label>Catégorie *</Label>
                            <div className="grid grid-cols-3 gap-3">
                                {goalCategories.map((category) => {
                                    const IconComponent = category.icon;
                                    return (
                                        <Button
                                            key={category.id}
                                            type="button"
                                            variant={formData.category === category.id ? 'default' : 'outline'}
                                            onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                                            className="flex flex-col items-center space-y-2 h-20 text-xs"
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                formData.category === category.id ? 'bg-white text-blue-600' : category.color
                                            }`}>
                                                <IconComponent className="w-4 h-4" />
                                            </div>
                                            <span>{category.name}</span>
                                        </Button>
                                    );
                                })}
                            </div>
                            {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Montants et dates */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Montants et échéance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Montant cible */}
                        <div className="space-y-2">
                            <Label htmlFor="targetAmount">Montant cible *</Label>
                            <Input
                                id="targetAmount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.targetAmount || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: parseFloat(e.target.value) || 0 }))}
                                placeholder="0.00"
                                className={errors.targetAmount ? 'border-red-500' : ''}
                            />
                            {errors.targetAmount && <p className="text-sm text-red-500">{errors.targetAmount}</p>}
                        </div>

                        {/* Montant actuel */}
                        <div className="space-y-2">
                            <Label htmlFor="currentAmount">Montant actuel</Label>
                            <Input
                                id="currentAmount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.currentAmount || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, currentAmount: parseFloat(e.target.value) || 0 }))}
                                placeholder="0.00"
                                className={errors.currentAmount ? 'border-red-500' : ''}
                            />
                            {errors.currentAmount && <p className="text-sm text-red-500">{errors.currentAmount}</p>}
                        </div>

                        {/* Date cible */}
                        <div className="space-y-2">
                            <Label htmlFor="targetDate">Date cible *</Label>
                            <Input
                                id="targetDate"
                                type="date"
                                value={formData.targetDate.toISOString().split('T')[0]}
                                onChange={(e) => setFormData(prev => ({ ...prev, targetDate: new Date(e.target.value) }))}
                                className={errors.targetDate ? 'border-red-500' : ''}
                            />
                            {errors.targetDate && <p className="text-sm text-red-500">{errors.targetDate}</p>}
                        </div>

                        {/* Priorité */}
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priorité</Label>
                            <Select value={formData.priority} onValueChange={(value: Priority) => setFormData(prev => ({ ...prev, priority: value }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Faible</SelectItem>
                                    <SelectItem value="medium">Moyenne</SelectItem>
                                    <SelectItem value="high">Élevée</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Aperçu du progrès */}
                        {formData.targetAmount > 0 && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Progrès</span>
                                    <span>{progress.toFixed(1)}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>{formatCurrency(formData.currentAmount, user.preferences.currency)}</span>
                                    <span>{formatCurrency(formData.targetAmount, user.preferences.currency)}</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Virement automatique */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                            <Zap className="w-5 h-5" />
                            <span>Virement automatique</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="autoTransfer">Activer les virements automatiques</Label>
                                <p className="text-sm text-gray-500">Transférer automatiquement de l'argent vers cet objectif</p>
                            </div>
                            <Switch
                                id="autoTransfer"
                                checked={enableAutoTransfer}
                                onCheckedChange={setEnableAutoTransfer}
                            />
                        </div>

                        {enableAutoTransfer && (
                            <>
                                {/* Compte source */}
                                <div className="space-y-2">
                                    <Label htmlFor="sourceAccount">Compte source *</Label>
                                    <Select value={formData.sourceAccount} onValueChange={(value) => setFormData(prev => ({ ...prev, sourceAccount: value }))}>
                                        <SelectTrigger className={errors.sourceAccount ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Sélectionner un compte" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {accounts.map(account => (
                                                <SelectItem key={account.id} value={account.id}>
                                                    {account.name} ({formatCurrency(account.balance, account.currency)})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.sourceAccount && <p className="text-sm text-red-500">{errors.sourceAccount}</p>}
                                </div>

                                {/* Montant du virement */}
                                <div className="space-y-2">
                                    <Label htmlFor="autoTransferAmount">Montant du virement *</Label>
                                    <Input
                                        id="autoTransferAmount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.autoTransferAmount || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, autoTransferAmount: parseFloat(e.target.value) || 0 }))}
                                        placeholder="0.00"
                                        className={errors.autoTransferAmount ? 'border-red-500' : ''}
                                    />
                                    {errors.autoTransferAmount && <p className="text-sm text-red-500">{errors.autoTransferAmount}</p>}
                                </div>

                                {/* Fréquence */}
                                <div className="space-y-2">
                                    <Label htmlFor="frequency">Fréquence</Label>
                                    <Select value={formData.autoTransferFrequency} onValueChange={(value: TransferFrequency) => setFormData(prev => ({ ...prev, autoTransferFrequency: value }))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="weekly">Hebdomadaire</SelectItem>
                                            <SelectItem value="monthly">Mensuel</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Estimation */}
                                {monthsToGoal > 0 && (
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-blue-800">
                                            <TrendingUp className="w-4 h-4 inline mr-1" />
                                            Avec ces virements automatiques, vous atteindrez votre objectif en environ{' '}
                                            <span className="font-semibold">{monthsToGoal} mois</span>
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Erreur générale */}
                {errors.submit && (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-4">
                            <p className="text-red-600 text-sm">{errors.submit}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Boutons d&apos;action */}
                <div className="flex space-x-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        className="flex-1"
                    >
                        Annuler
                    </Button>
                    <Button
                        type="submit"
                        disabled={saving}
                        className="flex-1"
                    >
                        {saving ? 'Création...' : 'Créer l\'objectif'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
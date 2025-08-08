'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    Target,
    Plus,
    Calendar,
  
    Clock,
    Eye,
    EyeOff,
} from 'lucide-react';
import { User, Account, SavingsGoal } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface SavingsPageData {
    user: User;
    accounts: Account[];
    savingsGoals: SavingsGoal[];
    totalSaved: number;
    totalTarget: number;
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
        accounts: Account[];
        transactions: unknown[];
        savingsGoals: SavingsGoal[];
        budgets: unknown[];
        categories: unknown[];
    }>;
}

interface AddFundsForm {
    amount: number;
    sourceAccount: string;
    description: string;
}

export default function SavingsPage() {
    const router = useRouter();
    const [savingsData, setSavingsData] = useState<SavingsPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showBalances, setShowBalances] = useState(true);
    const [addFundsOpen, setAddFundsOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
    const [addFundsForm, setAddFundsForm] = useState<AddFundsForm>({
        amount: 0,
        sourceAccount: '',
        description: ''
    });
    const [addingFunds, setAddingFunds] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadSavingsData();
    }, []);

    const loadSavingsData = async () => {
        try {
            console.log('🎯 Chargement des objectifs d\'épargne...');
            
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

            const savingsGoals = userData.savingsGoals || [];
            const accounts = userData.accounts || [];
            const totalSaved = savingsGoals.reduce((sum: number, goal: SavingsGoal) => sum + goal.currentAmount, 0);
            const totalTarget = savingsGoals.reduce((sum: number, goal: SavingsGoal) => sum + goal.targetAmount, 0);

            const savingsData: SavingsPageData = {
                user,
                accounts,
                savingsGoals: savingsGoals.sort((a: SavingsGoal, b: SavingsGoal) => {
                    // Trier par priorité puis par date de création
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                        return priorityOrder[b.priority] - priorityOrder[a.priority];
                    }
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                }),
                totalSaved,
                totalTarget
            };

            // Définir le compte par défaut pour l'ajout de fonds
            if (accounts.length > 0) {
                setAddFundsForm(prev => ({
                    ...prev,
                    sourceAccount: accounts[0].id
                }));
            }

            console.log('✅ Données d\'épargne chargées:', {
                totalGoals: savingsGoals.length,
                totalSaved,
                totalTarget,
                accounts: accounts.length
            });

            setSavingsData(savingsData);
        } catch (error) {
            console.error('❌ Erreur lors du chargement de l\'épargne:', error);
            router.push('/auth/login');
        } finally {
            setLoading(false);
        }
    };

    const openAddFundsModal = (goal: SavingsGoal) => {
        setSelectedGoal(goal);
        setAddFundsForm({
            amount: 0,
            sourceAccount: savingsData?.accounts[0]?.id || '',
            description: `Ajout de fonds pour ${goal.name}`
        });
        setErrors({});
        setAddFundsOpen(true);
    };

    const validateAddFundsForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (addFundsForm.amount <= 0) {
            newErrors.amount = 'Le montant doit être supérieur à 0';
        }

        if (!addFundsForm.sourceAccount) {
            newErrors.sourceAccount = 'Le compte source est requis';
        }

        // Vérifier si le compte a suffisamment de fonds
        if (savingsData && addFundsForm.sourceAccount) {
            const sourceAccount = savingsData.accounts.find(a => a.id === addFundsForm.sourceAccount);
            if (sourceAccount && sourceAccount.balance < addFundsForm.amount) {
                newErrors.amount = 'Solde insuffisant sur le compte source';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddFunds = async () => {
        if (!validateAddFundsForm() || !selectedGoal || !savingsData) return;

        setAddingFunds(true);
        console.log('💰 Ajout de fonds à l\'objectif:', selectedGoal.id, addFundsForm);

        try {
            const storageData = localStorage.getItem('budget_app_v2');
            if (!storageData) throw new Error('Données non trouvées');

            const data: StorageData = JSON.parse(storageData);
            const activeSession = data.sessions?.find((s: SessionData) => s.isActive);
            
            if (!activeSession) throw new Error('Session non trouvée');

            const userData = data.userData[activeSession.userId];

            // Mettre à jour l'objectif d'épargne
            const goalIndex = userData.savingsGoals.findIndex((g: SavingsGoal) => g.id === selectedGoal.id);
            if (goalIndex !== -1) {
                userData.savingsGoals[goalIndex].currentAmount += addFundsForm.amount;
                userData.savingsGoals[goalIndex].isCompleted = 
                    userData.savingsGoals[goalIndex].currentAmount >= userData.savingsGoals[goalIndex].targetAmount;
            }

            // Créer une transaction
            const newTransaction = {
                id: uuidv4(),
                userId: activeSession.userId,
                type: 'savings',
                amount: addFundsForm.amount,
                description: addFundsForm.description || `Ajout de fonds pour ${selectedGoal.name}`,
                category: 'Épargne',
                fromAccount: addFundsForm.sourceAccount,
                date: new Date(),
                isRecurring: false,
                tags: ['épargne', 'objectif'],
                createdAt: new Date()
            };

            if (!userData.transactions) userData.transactions = [];
            userData.transactions.push(newTransaction);

            // Mettre à jour le solde du compte source
            const sourceAccount = userData.accounts.find((a: Account) => a.id === addFundsForm.sourceAccount);
            if (sourceAccount) {
                sourceAccount.balance -= addFundsForm.amount;
                sourceAccount.lastUpdated = new Date();
            }

            // Sauvegarder
            localStorage.setItem('budget_app_v2', JSON.stringify(data));

            console.log('✅ Fonds ajoutés avec succès');
            
            // Fermer le modal et recharger les données
            setAddFundsOpen(false);
            loadSavingsData();
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'ajout de fonds:', error);
            setErrors({ submit: 'Erreur lors de l\'ajout de fonds' });
        } finally {
            setAddingFunds(false);
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const getGoalStatus = (goal: SavingsGoal) => {
        if (goal.isCompleted) return { status: 'completed', color: 'text-green-600', daysLeft: 0 };
        
        const today = new Date();
        const targetDate = new Date(goal.targetDate);
        const daysLeft = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysLeft < 0) return { status: 'overdue', color: 'text-red-600', daysLeft: Math.abs(daysLeft) };
        if (daysLeft <= 30) return { status: 'urgent', color: 'text-orange-600', daysLeft };
        return { status: 'normal', color: 'text-gray-600', daysLeft };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Target className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-pulse" />
                    <p className="text-gray-600">Chargement de vos objectifs...</p>
                </div>
            </div>
        );
    }

    if (!savingsData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">Erreur lors du chargement</p>
                    <Button onClick={() => router.push('/dashboard')}>
                        Retour au tableau de bord
                    </Button>
                </div>
            </div>
        );
    }

    const { user, accounts, savingsGoals, totalSaved, totalTarget } = savingsData;
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    return (
        <div className="space-y-4 pb-6">
            {/* En-tête avec bouton d'ajout visible */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900">Épargne</h1>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowBalances(!showBalances)}
                        className="p-2"
                    >
                        {showBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                        onClick={() => {
                            console.log('🎯 Navigation vers création d\'objectif');
                            router.push('/savings/add');
                        }}
                        size="sm"
                        className="flex items-center space-x-1"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Nouvel objectif</span>
                    </Button>
                </div>
            </div>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-2 gap-3">
                <Card>
                    <CardContent className="p-3">
                        <div className="text-center">
                            <p className="text-xs text-gray-600 mb-1">Total épargné</p>
                            <p className="text-lg font-bold text-green-600">
                                {showBalances ? formatCurrency(totalSaved, user.preferences.currency) : '••••'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-3">
                        <div className="text-center">
                            <p className="text-xs text-gray-600 mb-1">Objectif total</p>
                            <p className="text-lg font-bold text-blue-600">
                                {showBalances ? formatCurrency(totalTarget, user.preferences.currency) : '••••'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Progression globale */}
            {savingsGoals.length > 0 && (
                <Card>
                    <CardContent className="p-3">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Progression globale</span>
                                <span className="text-sm font-bold text-gray-900">{Math.round(overallProgress)}%</span>
                            </div>
                            <Progress value={overallProgress} className="h-2" />
                            <p className="text-xs text-gray-500 text-center">
                                {savingsGoals.length} objectif{savingsGoals.length > 1 ? 's' : ''} • 
                                {savingsGoals.filter(g => g.isCompleted).length} complété{savingsGoals.filter(g => g.isCompleted).length > 1 ? 's' : ''}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Liste des objectifs */}
            <div className="space-y-3">
                {savingsGoals.length > 0 ? (
                    savingsGoals.map((goal) => {
                        const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                        const { status, color, daysLeft } = getGoalStatus(goal);

                        return (
                            <Card key={goal.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="space-y-3">
                                        {/* En-tête de l'objectif */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2">
                                                    <h3 className="font-semibold text-gray-900 truncate">{goal.name}</h3>
                                                    <Badge 
                                                        variant={goal.priority === 'high' ? 'destructive' : 
                                                               goal.priority === 'medium' ? 'default' : 'secondary'}
                                                        className="text-xs"
                                                    >
                                                        {goal.priority === 'high' ? 'Haute' : 
                                                         goal.priority === 'medium' ? 'Moyenne' : 'Basse'}
                                                    </Badge>
                                                </div>
                                                {goal.description && (
                                                    <p className="text-sm text-gray-600 mt-1 truncate">{goal.description}</p>
                                                )}
                                                <div className="flex items-center space-x-3 mt-2">
                                                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>{new Date(goal.targetDate).toLocaleDateString('fr-FR')}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1 text-xs">
                                                        <Clock className="w-3 h-3" />
                                                        <span className={color}>
                                                            {status === 'completed' ? 'Complété' :
                                                             status === 'overdue' ? 'En retard' :
                                                             status === 'urgent' ? `${daysLeft} jour${daysLeft > 1 ? 's' : ''}` :
                                                             `${daysLeft} jours restants`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-gray-900">
                                                    {Math.round(progress)}%
                                                </p>
                                            </div>
                                        </div>

                                        {/* Barre de progression */}
                                        <div className="space-y-2">
                                            <Progress value={progress} className="h-2" />
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">
                                                    {showBalances ? formatCurrency(goal.currentAmount, user.preferences.currency) : '••••'}
                                                </span>
                                                <span className="text-gray-600">
                                                    {showBalances ? formatCurrency(goal.targetAmount, user.preferences.currency) : '••••'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Informations supplémentaires */}
                                        {goal.autoTransferAmount > 0 && (
                                            <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                                <span>Virement automatique</span>
                                                <span className="font-medium">
                                                    {showBalances ? formatCurrency(goal.autoTransferAmount, user.preferences.currency) : '••••'} / {goal.autoTransferFrequency === 'weekly' ? 'semaine' : 'mois'}
                                                </span>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex space-x-2 pt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openAddFundsModal(goal)}
                                                className="flex-1"
                                                disabled={goal.isCompleted}
                                            >
                                                <Plus className="w-3 h-3 mr-1" />
                                                {goal.isCompleted ? 'Complété' : 'Ajouter'}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    console.log('✏️ Modifier l\'objectif:', goal.id);
                                                    // TODO: Implémenter la modification
                                                }}
                                            >
                                                Modifier
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                ) : (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500 mb-2">Aucun objectif d'épargne</p>
                            <p className="text-sm text-gray-400 mb-4">
                                Créez votre premier objectif d'épargne pour commencer à économiser
                            </p>
                            <Button
                                onClick={() => {
                                    console.log('🎯 Navigation vers création d\'objectif d\'épargne');
                                    router.push('/savings/add');
                                }}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Créer un objectif
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Modal d'ajout de fonds */}
            <Dialog open={addFundsOpen} onOpenChange={setAddFundsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Ajouter des fonds</DialogTitle>
                    </DialogHeader>
                    {selectedGoal && (
                        <div className="space-y-4">
                            <div className="text-sm text-gray-600">
                                <p className="font-medium">{selectedGoal.name}</p>
                                <p>Montant actuel: {formatCurrency(selectedGoal.currentAmount, user.preferences.currency)}</p>
                                <p>Objectif: {formatCurrency(selectedGoal.targetAmount, user.preferences.currency)}</p>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="amount">Montant à ajouter *</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={addFundsForm.amount || ''}
                                        onChange={(e) => setAddFundsForm(prev => ({ 
                                            ...prev, 
                                            amount: parseFloat(e.target.value) || 0 
                                        }))}
                                        placeholder="0.00"
                                        className={errors.amount ? 'border-red-500' : ''}
                                    />
                                    {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="sourceAccount">Compte source *</Label>
                                    <Select 
                                        value={addFundsForm.sourceAccount} 
                                        onValueChange={(value) => setAddFundsForm(prev => ({ ...prev, sourceAccount: value }))}
                                    >
                                        <SelectTrigger className={errors.sourceAccount ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Sélectionner un compte" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {accounts.map((account) => (
                                                <SelectItem key={account.id} value={account.id}>
                                                    {account.name} - {formatCurrency(account.balance, user.preferences.currency)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.sourceAccount && <p className="text-xs text-red-500">{errors.sourceAccount}</p>}
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="description">Description (optionnel)</Label>
                                    <Input
                                        id="description"
                                        value={addFundsForm.description}
                                        onChange={(e) => setAddFundsForm(prev => ({ 
                                            ...prev, 
                                            description: e.target.value 
                                        }))}
                                        placeholder="Description de l'ajout de fonds"
                                    />
                                </div>
                            </div>

                            {errors.submit && (
                                <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                                    {errors.submit}
                                </div>
                            )}

                            <div className="flex space-x-2 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setAddFundsOpen(false)}
                                    className="flex-1"
                                    disabled={addingFunds}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    onClick={handleAddFunds}
                                    disabled={addingFunds}
                                    className="flex-1"
                                >
                                    {addingFunds ? 'Ajout...' : 'Ajouter les fonds'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Bouton d'ajout flottant */}
            <div className="fixed bottom-20 right-4">
                <Button
                    onClick={() => {
                        console.log('🎯 Navigation vers ajout d\'objectif (FAB)');
                        router.push('/savings/add');
                    }}
                    size="lg"
                    className="rounded-full w-14 h-14 shadow-lg"
                >
                    <Plus className="w-6 h-6" />
                </Button>
            </div>
        </div>
    );
}
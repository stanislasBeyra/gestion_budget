'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Target,
    ArrowUpRight,
    ArrowDownRight,
    Plus,
    Eye,
    EyeOff,
    Calendar,
    CreditCard
} from 'lucide-react';
import { User, Account, Transaction, SavingsGoal } from '@/types';

interface DashboardData {
    user: User;
    accounts: Account[];
    recentTransactions: Transaction[];
    savingsGoals: SavingsGoal[];
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
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
        transactions: Transaction[];
        savingsGoals: SavingsGoal[];
        budgets: unknown[];
        categories: unknown[];
    }>;
}

export default function DashboardPage() {
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showBalances, setShowBalances] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                console.log('📊 Chargement du dashboard...');

                const storageData = localStorage.getItem('budget_app_v2');
                if (!storageData) {
                    console.error('❌ Aucune donnée trouvée dans localStorage');
                    router.push('/auth/login');
                    return;
                }

                const data: StorageData = JSON.parse(storageData);

                // Vérifier la session active
                const activeSessions = data.sessions?.filter((session: SessionData) =>
                    session.isActive && new Date(session.expiresAt) > new Date()
                );

                if (!activeSessions || activeSessions.length === 0) {
                    console.error('❌ Aucune session active trouvée');
                    router.push('/auth/login');
                    return;
                }

                const currentSession = activeSessions[0];
                const userId = currentSession.userId;

                // Récupérer les données utilisateur
                const user = data.users?.find((u: User) => u.id === userId);
                if (!user) {
                    console.error('❌ Utilisateur non trouvé pour la session');
                    router.push('/auth/login');
                    return;
                }

                const userData = data.userData?.[userId] || {
                    accounts: [],
                    transactions: [],
                    savingsGoals: [],
                    budgets: [],
                    categories: []
                };

                console.log('👤 Utilisateur connecté:', user.username);
                console.log('💳 Comptes:', userData.accounts?.length || 0);
                console.log('💸 Transactions:', userData.transactions?.length || 0);

                // Calculer le solde total
                const totalBalance = userData.accounts?.reduce((sum: number, account: Account) =>
                    sum + account.balance, 0) || 0;

                // Calculer les revenus et dépenses du mois
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();

                const monthlyTransactions = userData.transactions?.filter((t: Transaction) => {
                    const transactionDate = new Date(t.date);
                    return transactionDate.getMonth() === currentMonth &&
                        transactionDate.getFullYear() === currentYear;
                }) || [];

                const monthlyIncome = monthlyTransactions
                    .filter((t: Transaction) => t.type === 'income')
                    .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

                const monthlyExpenses = monthlyTransactions
                    .filter((t: Transaction) => t.type === 'expense')
                    .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

                console.log('💵 Revenus du mois:', monthlyIncome, user.preferences.currency);
                console.log('💸 Dépenses du mois:', monthlyExpenses, user.preferences.currency);

                // Transactions récentes (5 dernières)
                const recentTransactions = userData.transactions
                    .sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5);

                console.log('🕒 Transactions récentes:', recentTransactions.length);
                console.log('🎯 Objectifs d\'épargne:', userData.savingsGoals?.length || 0);

                setDashboardData({
                    user,
                    accounts: userData.accounts || [],
                    recentTransactions,
                    savingsGoals: userData.savingsGoals || [],
                    totalBalance,
                    monthlyIncome,
                    monthlyExpenses
                });

            } catch (error) {
                console.error('💥 Erreur lors du chargement du dashboard:', error);
                router.push('/auth/login');
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboardData();
    }, [router]);

    const formatCurrency = (amount: number, currency = 'EUR') => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                {/* Skeleton Loading */}
                <div className="space-y-4">
                    <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-24 bg-gray-200 rounded-lg animate-pulse" />
                        <div className="h-24 bg-gray-200 rounded-lg animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <p className="text-gray-500">Erreur de chargement des données</p>
                    <Button
                        onClick={() => router.push('/auth/login')}
                        className="mt-4"
                    >
                        Retour à la connexion
                    </Button>
                </div>
            </div>
        );
    }

    const { user, recentTransactions, savingsGoals, totalBalance, monthlyIncome, monthlyExpenses } = dashboardData;

    return (
        <div className="space-y-6">
            {/* Carte Solde Principal - Version Compacte Optimisée */}
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-none">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            <Wallet className="w-4 h-4" />
                            <span className="text-blue-100 text-xs">Solde Total</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowBalances(!showBalances)}
                            className="text-white hover:bg-white/20 h-6 w-6 p-0"
                        >
                            {showBalances ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </Button>
                    </div>
                    <div className="text-xl font-bold mb-3 text-center">
                        {showBalances ? formatCurrency(totalBalance, user.preferences.currency) : '••••••'}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1">
                            <ArrowUpRight className="w-3 h-3 text-green-300" />
                            <div>
                                <p className="text-blue-100">Revenus</p>
                                <p className="font-semibold text-xs">
                                    {showBalances ? formatCurrency(monthlyIncome, user.preferences.currency) : '••••'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1">
                            <ArrowDownRight className="w-3 h-3 text-red-300" />
                            <div>
                                <p className="text-blue-100">Dépenses</p>
                                <p className="font-semibold text-xs">
                                    {showBalances ? formatCurrency(monthlyExpenses, user.preferences.currency) : '••••'}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Objectifs d'Épargne */}
            <Card className="shadow-none">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                            <Target className="w-5 h-5 text-blue-600" />
                            <span>Objectifs d&apos;Épargne</span>
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                console.log('🎯 Navigation vers épargne');
                                router.push('/savings');
                            }}
                            className="text-blue-600 hover:text-blue-700"
                        >
                            Voir tout
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="shadow-none">
                    {savingsGoals.length > 0 ? (
                        <div className="space-y-3">
                            {savingsGoals.slice(0, 3).map((goal) => {
                                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                                const isCompleted = goal.isCompleted || progress >= 100;
                                
                                return (
                                    <Card key={goal.id} className="p-3 shadow-none">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <div className={`w-2 h-2 rounded-full ${
                                                    goal.priority === 'high' ? 'bg-red-500' :
                                                    goal.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                                }`} />
                                                <span className="font-medium text-sm truncate">{goal.name}</span>
                                            </div>
                                            <Badge variant={isCompleted ? "default" : "secondary"} className="text-xs">
                                                {isCompleted ? 'Terminé' : `${Math.round(progress)}%`}
                                            </Badge>
                                        </div>
                                        <div className="space-y-2">
                                            <Progress value={Math.min(progress, 100)} className="h-2" />
                                            <div className="flex justify-between text-xs text-gray-600">
                                                <span>
                                                    {showBalances ? formatCurrency(goal.currentAmount, user.preferences.currency) : '••••'}
                                                </span>
                                                <span>
                                                    {showBalances ? formatCurrency(goal.targetAmount, user.preferences.currency) : '••••'}
                                                </span>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500 mb-3 text-sm">Aucun objectif d&apos;épargne</p>
                            <Button
                                onClick={() => {
                                    console.log('➕ Navigation vers création d\'objectif');
                                    router.push('/savings/add');
                                }}
                                size="sm"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Créer un objectif
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Transactions Récentes */}
            <Card className="shadow-none">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                            <span>Transactions Récentes</span>
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                console.log('💳 Navigation vers transactions');
                                router.push('/transactions');
                            }}
                            className="text-blue-600 hover:text-blue-700"
                        >
                            Voir tout
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="shadow-none">
                    {recentTransactions.length > 0 ? (
                        <div className="space-y-3">
                            {recentTransactions.map((transaction) => (
                                <Card key={transaction.id} className="p-3 shadow-none">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                transaction.type === 'income'
                                                    ? 'bg-green-100 text-green-600'
                                                    : transaction.type === 'expense'
                                                    ? 'bg-red-100 text-red-600'
                                                    : 'bg-blue-100 text-blue-600'
                                            }`}>
                                                {transaction.type === 'income' ? (
                                                    <TrendingUp className="w-4 h-4" />
                                                ) : transaction.type === 'expense' ? (
                                                    <TrendingDown className="w-4 h-4" />
                                                ) : (
                                                    <ArrowUpRight className="w-4 h-4" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-sm truncate">{transaction.description}</p>
                                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                    <span>{transaction.category}</span>
                                                    <span>•</span>
                                                    <Calendar className="w-3 h-3" />
                                                    <span>
                                                        {new Date(transaction.date).toLocaleDateString('fr-FR', {
                                                            day: '2-digit',
                                                            month: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-semibold text-sm ${
                                                transaction.type === 'income' ? 'text-green-600' : 
                                                transaction.type === 'expense' ? 'text-red-600' : 'text-blue-600'
                                            }`}>
                                                {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                                                {showBalances ? formatCurrency(transaction.amount, user.preferences.currency) : '••••'}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500 mb-3 text-sm">Aucune transaction récente</p>
                            <Button
                                onClick={() => {
                                    console.log('➕ Navigation vers ajout de transaction');
                                    router.push('/transactions/add');
                                }}
                                size="sm"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Ajouter une transaction
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
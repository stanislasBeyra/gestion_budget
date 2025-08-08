'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
    BarChart3, 
    PieChart, 
    TrendingUp, 
    TrendingDown,
    Calendar,
    Download,
    Filter,
    DollarSign,
    Target,
    CreditCard
} from 'lucide-react';
import { Transaction, User, Account, SavingsGoal } from '@/types';

interface ReportsPageData {
    user: User;
    accounts: Account[];
    transactions: Transaction[];
    savingsGoals: SavingsGoal[];
}

interface CategorySummary {
    category: string;
    totalAmount: number;
    transactionCount: number;
    percentage: number;
}

interface MonthlyData {
    month: string;
    income: number;
    expenses: number;
    net: number;
}

export default function ReportsPage() {
    const router = useRouter();
    const [reportsData, setReportsData] = useState<ReportsPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

    useEffect(() => {
        console.log('📊 Chargement de la page Rapports');
        loadReportsData();
    }, []);

    const loadReportsData = () => {
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

            const reportsData: ReportsPageData = {
                user,
                accounts: userData.accounts || [],
                transactions: userData.transactions || [],
                savingsGoals: userData.savingsGoals || []
            };

            console.log('✅ Données de rapports chargées:', {
                transactions: reportsData.transactions.length,
                accounts: reportsData.accounts.length,
                savingsGoals: reportsData.savingsGoals.length
            });

            setReportsData(reportsData);
        } catch (error) {
            console.error('❌ Erreur lors du chargement des rapports:', error);
            router.push('/auth/login');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const getFilteredTransactions = () => {
        if (!reportsData) return [];

        const now = new Date();
        let startDate: Date;
        let endDate: Date = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Fin du mois actuel

        switch (selectedPeriod) {
            case 'month':
                startDate = new Date(selectedYear, selectedMonth, 1);
                endDate = new Date(selectedYear, selectedMonth + 1, 0);
                break;
            case 'quarter':
                const quarter = Math.floor(selectedMonth / 3);
                startDate = new Date(selectedYear, quarter * 3, 1);
                endDate = new Date(selectedYear, quarter * 3 + 3, 0);
                break;
            case 'year':
                startDate = new Date(selectedYear, 0, 1);
                endDate = new Date(selectedYear, 11, 31);
                break;
            default:
                startDate = new Date(selectedYear, selectedMonth, 1);
                endDate = new Date(selectedYear, selectedMonth + 1, 0);
        }

        return reportsData.transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= startDate && transactionDate <= endDate;
        });
    };

    const calculateCategorySummary = (type: 'income' | 'expense'): CategorySummary[] => {
        const filteredTransactions = getFilteredTransactions().filter(t => t.type === type);
        const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
        
        const categoryMap = new Map<string, { amount: number; count: number }>();
        
        filteredTransactions.forEach(transaction => {
            const existing = categoryMap.get(transaction.category) || { amount: 0, count: 0 };
            categoryMap.set(transaction.category, {
                amount: existing.amount + transaction.amount,
                count: existing.count + 1
            });
        });

        return Array.from(categoryMap.entries())
            .map(([category, data]) => ({
                category,
                totalAmount: data.amount,
                transactionCount: data.count,
                percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0
            }))
            .sort((a, b) => b.totalAmount - a.totalAmount);
    };

    const calculateMonthlyData = (): MonthlyData[] => {
        if (!reportsData) return [];

        const monthlyMap = new Map<string, { income: number; expenses: number }>();
        
        // Initialiser les 12 derniers mois
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
            monthlyMap.set(key, { income: 0, expenses: 0 });
        }

        // Calculer les données
        reportsData.transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            const existing = monthlyMap.get(key);
            
            if (existing) {
                if (transaction.type === 'income') {
                    existing.income += transaction.amount;
                } else if (transaction.type === 'expense') {
                    existing.expenses += transaction.amount;
                }
            }
        });

        return Array.from(monthlyMap.entries())
            .map(([key, data]) => {
                const [year, month] = key.split('-');
                const date = new Date(parseInt(year), parseInt(month));
                return {
                    month: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
                    income: data.income,
                    expenses: data.expenses,
                    net: data.income - data.expenses
                };
            });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-pulse" />
                    <p className="text-gray-600">Chargement des rapports...</p>
                </div>
            </div>
        );
    }

    if (!reportsData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">Erreur lors du chargement des rapports</p>
                    <Button onClick={() => router.push('/dashboard')}>
                        Retour au tableau de bord
                    </Button>
                </div>
            </div>
        );
    }

    const { user } = reportsData;
    const filteredTransactions = getFilteredTransactions();
    const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netIncome = totalIncome - totalExpenses;
    
    const expenseCategories = calculateCategorySummary('expense');
    const incomeCategories = calculateCategorySummary('income');
    const monthlyData = calculateMonthlyData();

    return (
        <div className="space-y-6">
            {/* En-tête avec filtres */}
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
                    <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Exporter
                    </Button>
                </div>
                
                <div className="flex flex-wrap gap-3">
                    <Select value={selectedPeriod} onValueChange={(value: 'month' | 'quarter' | 'year') => setSelectedPeriod(value)}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="month">Mois</SelectItem>
                            <SelectItem value="quarter">Trimestre</SelectItem>
                            <SelectItem value="year">Année</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                        <SelectTrigger className="w-24">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[2024, 2023, 2022].map(year => (
                                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    
                    {selectedPeriod === 'month' && (
                        <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <SelectItem key={i} value={i.toString()}>
                                        {new Date(2024, i).toLocaleDateString('fr-FR', { month: 'long' })}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {/* Résumé financier */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Revenus</p>
                                <p className="text-lg font-bold text-green-600">
                                    {formatCurrency(totalIncome, user.preferences.currency)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <TrendingDown className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Dépenses</p>
                                <p className="text-lg font-bold text-red-600">
                                    {formatCurrency(totalExpenses, user.preferences.currency)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                netIncome >= 0 ? 'bg-blue-100' : 'bg-orange-100'
                            }`}>
                                <DollarSign className={`w-5 h-5 ${
                                    netIncome >= 0 ? 'text-blue-600' : 'text-orange-600'
                                }`} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Net</p>
                                <p className={`text-lg font-bold ${
                                    netIncome >= 0 ? 'text-blue-600' : 'text-orange-600'
                                }`}>
                                    {formatCurrency(netIncome, user.preferences.currency)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Dépenses par catégorie */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <PieChart className="w-5 h-5 text-red-600" />
                        <span>Dépenses par Catégorie</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {expenseCategories.length > 0 ? (
                        <div className="space-y-3">
                            {expenseCategories.slice(0, 5).map((category, index) => (
                                <div key={category.category} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-3 h-3 rounded-full bg-red-${(index + 1) * 100}`}></div>
                                        <span className="text-sm font-medium">{category.category}</span>
                                        <Badge variant="secondary" className="text-xs">
                                            {category.transactionCount} transactions
                                        </Badge>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold">
                                            {formatCurrency(category.totalAmount, user.preferences.currency)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {category.percentage.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <PieChart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Aucune dépense pour cette période</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Revenus par catégorie */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="w-5 h-5 text-green-600" />
                        <span>Revenus par Catégorie</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {incomeCategories.length > 0 ? (
                        <div className="space-y-3">
                            {incomeCategories.slice(0, 5).map((category, index) => (
                                <div key={category.category} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-3 h-3 rounded-full bg-green-${(index + 1) * 100}`}></div>
                                        <span className="text-sm font-medium">{category.category}</span>
                                        <Badge variant="secondary" className="text-xs">
                                            {category.transactionCount} transactions
                                        </Badge>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold">
                                            {formatCurrency(category.totalAmount, user.preferences.currency)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {category.percentage.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Aucun revenu pour cette période</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Évolution mensuelle */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <span>Évolution sur 12 mois</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {monthlyData.slice(-6).map((month) => (
                            <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium">{month.month}</span>
                                <div className="flex space-x-4 text-sm">
                                    <span className="text-green-600">
                                        +{formatCurrency(month.income, user.preferences.currency)}
                                    </span>
                                    <span className="text-red-600">
                                        -{formatCurrency(month.expenses, user.preferences.currency)}
                                    </span>
                                    <span className={`font-semibold ${
                                        month.net >= 0 ? 'text-blue-600' : 'text-orange-600'
                                    }`}>
                                        {formatCurrency(month.net, user.preferences.currency)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
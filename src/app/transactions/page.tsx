'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
    Search, 
    Plus,
    TrendingUp, 
    TrendingDown,
    MapPin,
    Edit,
    Trash2,
    MoreVertical
} from 'lucide-react';
import { Transaction, User, Account } from '@/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TransactionsPageData {
    user: User;
    accounts: Account[];
    transactions: Transaction[];
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
    }>;
}

export default function TransactionsPage() {
    const router = useRouter();
    const [transactionsData, setTransactionsData] = useState<TransactionsPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        console.log('💳 Chargement de la page Transactions');
        loadTransactionsData();
    }, []);

    const loadTransactionsData = () => {
        try {
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

            const transactionsData: TransactionsPageData = {
                user,
                accounts: userData.accounts || [],
                transactions: userData.transactions || []
            };

            console.log('✅ Données de transactions chargées:', {
                transactions: transactionsData.transactions.length,
                accounts: transactionsData.accounts.length
            });

            setTransactionsData(transactionsData);
        } catch (error) {
            console.error('❌ Erreur lors du chargement des transactions:', error);
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

    const getFilteredAndSortedTransactions = () => {
        if (!transactionsData) return [];

        const filtered = transactionsData.transactions.filter(transaction => {
            const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || transaction.category === selectedCategory;
            const matchesType = selectedType === 'all' || transaction.type === selectedType;
            
            return matchesSearch && matchesCategory && matchesType;
        });

        // Tri
        filtered.sort((a, b) => {
            if (sortBy === 'date') {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            } else {
                return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
            }
        });

        return filtered;
    };

    const getUniqueCategories = () => {
        if (!transactionsData) return [];
        const categories = [...new Set(transactionsData.transactions.map(t => t.category))];
        return categories.sort();
    };

    const handleDeleteTransaction = (transactionId: string) => {
        if (!transactionsData) return;
        
        console.log('🗑️ Suppression de la transaction:', transactionId);
        
        try {
            const storageData = localStorage.getItem('budget_app_v2');
            if (!storageData) return;

            const data: StorageData = JSON.parse(storageData);
            const activeSession = data.sessions?.find((s: SessionData) => s.isActive);
            
            if (!activeSession) return;

            // Supprimer la transaction
            const userData = data.userData[activeSession.userId];
            userData.transactions = userData.transactions.filter((t: Transaction) => t.id !== transactionId);
            
            // Sauvegarder
            localStorage.setItem('budget_app_v2', JSON.stringify(data));
            
            // Recharger les données
            loadTransactionsData();
            
            console.log('✅ Transaction supprimée avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de la suppression:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-pulse" />
                    <p className="text-gray-600">Chargement des transactions...</p>
                </div>
            </div>
        );
    }

    if (!transactionsData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">Erreur lors du chargement des transactions</p>
                    <Button onClick={() => router.push('/dashboard')}>
                        Retour au tableau de bord
                    </Button>
                </div>
            </div>
        );
    }

    const { user } = transactionsData;
    const filteredTransactions = getFilteredAndSortedTransactions();
    const categories = getUniqueCategories();

    return (
        <div className="space-y-4 pb-4">
            {/* En-tête compact */}
            <div className="flex items-center justify-between py-2">
                <h1 className="text-xl font-bold text-gray-900">Transactions</h1>
                <Button 
                    onClick={() => {
                        console.log('➕ Navigation vers ajout de transaction');
                        router.push('/transactions/add');
                    }}
                    size="sm"
                    className="flex items-center space-x-1"
                >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter</span>
                </Button>
            </div>

            {/* Filtres et recherche compacts */}
            <Card>
                <CardContent className="p-3">
                    <div className="space-y-3">
                        {/* Barre de recherche */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Rechercher..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-9"
                            />
                        </div>

                        {/* Filtres en grille responsive */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous</SelectItem>
                                    <SelectItem value="income">Revenus</SelectItem>
                                    <SelectItem value="expense">Dépenses</SelectItem>
                                    <SelectItem value="transfer">Virements</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Catégorie" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Toutes</SelectItem>
                                    {categories.map(category => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={sortBy} onValueChange={(value: 'date' | 'amount') => setSortBy(value)}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="date">Date</SelectItem>
                                    <SelectItem value="amount">Montant</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="h-9"
                            >
                                {sortOrder === 'desc' ? '↓' : '↑'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Liste des transactions optimisée */}
            <div className="space-y-2">
                {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction) => (
                        <Card key={transaction.id} className="hover:shadow-sm transition-shadow">
                            <CardContent className="p-3">
                                <div className="flex items-start space-x-3">
                                    {/* Icône */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
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
                                            <TrendingUp className="w-4 h-4" />
                                        )}
                                    </div>

                                    {/* Contenu principal */}
                                    <div className="flex-1 min-w-0">
                                        {/* Première ligne : Description et montant */}
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                                                <p className="font-medium text-gray-900 truncate text-sm">
                                                    {transaction.description}
                                                </p>
                                                {transaction.isRecurring && (
                                                    <Badge variant="secondary" className="text-xs px-1 py-0">
                                                        R
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className={`font-semibold text-sm ml-2 flex-shrink-0 ${
                                                transaction.type === 'income' ? 'text-green-600' : 
                                                transaction.type === 'expense' ? 'text-red-600' : 'text-blue-600'
                                            }`}>
                                                {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                                                {formatCurrency(transaction.amount, user.preferences.currency)}
                                            </p>
                                        </div>

                                        {/* Deuxième ligne : Détails */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2 text-xs text-gray-500 min-w-0 flex-1">
                                                <span className="truncate">{transaction.category}</span>
                                                <span>•</span>
                                                <span className="flex-shrink-0">
                                                    {new Date(transaction.date).toLocaleDateString('fr-FR', {
                                                        day: '2-digit',
                                                        month: '2-digit'
                                                    })}
                                                </span>
                                                {transaction.tags.length > 0 && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="truncate">{transaction.tags[0]}</span>
                                                        {transaction.tags.length > 1 && (
                                                            <span>+{transaction.tags.length - 1}</span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                            {/* Menu d&apos;actions */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 flex-shrink-0"
                                                    >
                                                        <MoreVertical className="w-3 h-3" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            console.log('✏️ Édition de la transaction:', transaction.id);
                                                            router.push(`/transactions/edit/${transaction.id}`);
                                                        }}
                                                    >
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Modifier
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteTransaction(transaction.id)}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Supprimer
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {/* Localisation si présente */}
                                        {transaction.location && (
                                            <div className="flex items-center text-xs text-gray-400 mt-1">
                                                <MapPin className="w-3 h-3 mr-1" />
                                                <span className="truncate">{transaction.location}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card>
                        <CardContent className="p-6">
                            <div className="text-center text-gray-500">
                                <TrendingUp className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                                <p className="mb-2 text-sm">Aucune transaction trouvée</p>
                                <p className="text-xs mb-4">
                                    {searchTerm || selectedCategory !== 'all' || selectedType !== 'all'
                                        ? 'Essayez de modifier vos filtres'
                                        : 'Commencez par ajouter votre première transaction'
                                    }
                                </p>
                                <Button
                                    onClick={() => {
                                        console.log('➕ Navigation vers ajout de transaction depuis empty state');
                                        router.push('/transactions/add');
                                    }}
                                    size="sm"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Ajouter une transaction
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Résumé compact */}
            {filteredTransactions.length > 0 && (
                <Card>
                    <CardContent className="p-3">
                        <div className="space-y-2">
                            <div className="text-xs text-gray-600 text-center">
                                {filteredTransactions.length} transaction(s) affichée(s)
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-green-600">
                                    Revenus: {formatCurrency(
                                        filteredTransactions
                                            .filter(t => t.type === 'income')
                                            .reduce((sum, t) => sum + t.amount, 0),
                                        user.preferences.currency
                                    )}
                                </span>
                                <span className="text-red-600">
                                    Dépenses: {formatCurrency(
                                        filteredTransactions
                                            .filter(t => t.type === 'expense')
                                            .reduce((sum, t) => sum + t.amount, 0),
                                        user.preferences.currency
                                    )}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
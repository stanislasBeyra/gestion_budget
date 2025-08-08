'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
    ArrowLeft,
    Plus,
    TrendingUp, 
    TrendingDown,
    Calendar,
    Tag,
    MapPin,
    Receipt,
    X
} from 'lucide-react';
import { TransactionForm, User, Account } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface AddTransactionPageData {
    user: User;
    accounts: Account[];
}

const defaultCategories = {
    income: ['Salaire', 'Freelance', 'Investissements', 'Cadeaux', 'Autres revenus'],
    expense: ['Alimentation', 'Transport', 'Logement', 'Santé', 'Loisirs', 'Shopping', 'Factures', 'Autres dépenses']
};

export default function AddTransactionPage() {
    const router = useRouter();
    const [pageData, setPageData] = useState<AddTransactionPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState<TransactionForm>({
        type: 'expense',
        amount: 0,
        description: '',
        category: '',
        subcategory: '',
        fromAccount: '',
        toAccount: '',
        date: new Date(),
        isRecurring: false,
        recurringPattern: '',
        tags: []
    });
    
    const [newTag, setNewTag] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        console.log('➕ Chargement de la page d\'ajout de transaction');
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

            const pageData: AddTransactionPageData = {
                user,
                accounts: userData.accounts || []
            };

            // Définir le compte par défaut
            if (pageData.accounts.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    fromAccount: pageData.accounts[0].id
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

        if (!formData.description.trim()) {
            newErrors.description = 'La description est requise';
        }

        if (formData.amount <= 0) {
            newErrors.amount = 'Le montant doit être supérieur à 0';
        }

        if (!formData.category) {
            newErrors.category = 'La catégorie est requise';
        }

        if (!formData.fromAccount && formData.type !== 'transfer') {
            newErrors.fromAccount = 'Le compte est requis';
        }

        if (formData.type === 'transfer' && !formData.toAccount) {
            newErrors.toAccount = 'Le compte de destination est requis';
        }

        if (formData.type === 'transfer' && formData.fromAccount === formData.toAccount) {
            newErrors.toAccount = 'Les comptes source et destination doivent être différents';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm() || !pageData) return;

        setSaving(true);
        console.log('💾 Sauvegarde de la transaction:', formData);

        try {
            const storageData = localStorage.getItem('budget_app_v2');
            if (!storageData) throw new Error('Données non trouvées');

            const data = JSON.parse(storageData);
            const activeSession = data.sessions?.find((s: any) => s.isActive);
            
            if (!activeSession) throw new Error('Session non trouvée');

            // Créer la nouvelle transaction
            const newTransaction = {
                id: uuidv4(),
                userId: activeSession.userId,
                type: formData.type,
                amount: formData.amount,
                description: formData.description.trim(),
                category: formData.category,
                subcategory: formData.subcategory || undefined,
                fromAccount: formData.fromAccount || undefined,
                toAccount: formData.toAccount || undefined,
                date: formData.date,
                isRecurring: formData.isRecurring,
                recurringPattern: formData.recurringPattern || undefined,
                tags: formData.tags,
                createdAt: new Date()
            };

            // Ajouter la transaction
            const userData = data.userData[activeSession.userId];
            if (!userData.transactions) userData.transactions = [];
            userData.transactions.push(newTransaction);

            // Mettre à jour les soldes des comptes
            if (formData.type === 'income' && formData.fromAccount) {
                const account = userData.accounts.find((a: Account) => a.id === formData.fromAccount);
                if (account) {
                    account.balance += formData.amount;
                    account.lastUpdated = new Date();
                }
            } else if (formData.type === 'expense' && formData.fromAccount) {
                const account = userData.accounts.find((a: Account) => a.id === formData.fromAccount);
                if (account) {
                    account.balance -= formData.amount;
                    account.lastUpdated = new Date();
                }
            } else if (formData.type === 'transfer' && formData.fromAccount && formData.toAccount) {
                const fromAccount = userData.accounts.find((a: Account) => a.id === formData.fromAccount);
                const toAccount = userData.accounts.find((a: Account) => a.id === formData.toAccount);
                
                if (fromAccount && toAccount) {
                    fromAccount.balance -= formData.amount;
                    toAccount.balance += formData.amount;
                    fromAccount.lastUpdated = new Date();
                    toAccount.lastUpdated = new Date();
                }
            }

            // Sauvegarder
            localStorage.setItem('budget_app_v2', JSON.stringify(data));

            console.log('✅ Transaction créée avec succès:', newTransaction.id);
            
            // Rediriger vers la liste des transactions
            router.push('/transactions');
            
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde:', error);
            setErrors({ submit: 'Erreur lors de la sauvegarde' });
        } finally {
            setSaving(false);
        }
    };

    const addTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()]
            }));
            setNewTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Plus className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-pulse" />
                    <p className="text-gray-600">Chargement...</p>
                </div>
            </div>
        );
    }

    if (!pageData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Plus className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">Erreur lors du chargement</p>
                    <Button onClick={() => router.push('/transactions')}>
                        Retour aux transactions
                    </Button>
                </div>
            </div>
        );
    }

    const { user, accounts } = pageData;
    const availableCategories = defaultCategories[formData.type as 'income' | 'expense'] || [];

    return (
        <div className="space-y-6">
           

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Type de transaction */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Type de Transaction</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                            <Button
                                type="button"
                                variant={formData.type === 'expense' ? 'default' : 'outline'}
                                onClick={() => setFormData(prev => ({ ...prev, type: 'expense', category: '' }))}
                                className="flex flex-col items-center space-y-2 h-16"
                            >
                                <TrendingDown className="w-5 h-5" />
                                <span className="text-sm">Dépense</span>
                            </Button>
                            <Button
                                type="button"
                                variant={formData.type === 'income' ? 'default' : 'outline'}
                                onClick={() => setFormData(prev => ({ ...prev, type: 'income', category: '' }))}
                                className="flex flex-col items-center space-y-2 h-16"
                            >
                                <TrendingUp className="w-5 h-5" />
                                <span className="text-sm">Revenu</span>
                            </Button>
                            <Button
                                type="button"
                                variant={formData.type === 'transfer' ? 'default' : 'outline'}
                                onClick={() => setFormData(prev => ({ ...prev, type: 'transfer', category: 'Virement' }))}
                                className="flex flex-col items-center space-y-2 h-16"
                            >
                                <TrendingUp className="w-5 h-5" />
                                <span className="text-sm">Virement</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Informations principales */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Informations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Montant */}
                        <div className="space-y-2">
                            <Label htmlFor="amount">Montant *</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.amount || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                                placeholder="0.00"
                                className={errors.amount ? 'border-red-500' : ''}
                            />
                            {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Description de la transaction"
                                className={errors.description ? 'border-red-500' : ''}
                            />
                            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                        </div>

                        {/* Catégorie */}
                        {formData.type !== 'transfer' && (
                            <div className="space-y-2">
                                <Label htmlFor="category">Catégorie *</Label>
                                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                                    <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Sélectionner une catégorie" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableCategories.map(category => (
                                            <SelectItem key={category} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
                            </div>
                        )}

                        {/* Date */}
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date.toISOString().split('T')[0]}
                                onChange={(e) => setFormData(prev => ({ ...prev, date: new Date(e.target.value) }))}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Comptes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Comptes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Compte source */}
                        <div className="space-y-2">
                            <Label htmlFor="fromAccount">
                                {formData.type === 'transfer' ? 'Compte source *' : 'Compte *'}
                            </Label>
                            <Select value={formData.fromAccount} onValueChange={(value) => setFormData(prev => ({ ...prev, fromAccount: value }))}>
                                <SelectTrigger className={errors.fromAccount ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Sélectionner un compte" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map(account => (
                                        <SelectItem key={account.id} value={account.id}>
                                            {account.name} ({new Intl.NumberFormat('fr-FR', {
                                                style: 'currency',
                                                currency: account.currency,
                                            }).format(account.balance)})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.fromAccount && <p className="text-sm text-red-500">{errors.fromAccount}</p>}
                        </div>

                        {/* Compte destination (pour les virements) */}
                        {formData.type === 'transfer' && (
                            <div className="space-y-2">
                                <Label htmlFor="toAccount">Compte destination *</Label>
                                <Select value={formData.toAccount} onValueChange={(value) => setFormData(prev => ({ ...prev, toAccount: value }))}>
                                    <SelectTrigger className={errors.toAccount ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Sélectionner un compte" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accounts.filter(account => account.id !== formData.fromAccount).map(account => (
                                            <SelectItem key={account.id} value={account.id}>
                                                {account.name} ({new Intl.NumberFormat('fr-FR', {
                                                    style: 'currency',
                                                    currency: account.currency,
                                                }).format(account.balance)})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.toAccount && <p className="text-sm text-red-500">{errors.toAccount}</p>}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Options avancées */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Transaction récurrente */}
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="recurring">Transaction récurrente</Label>
                                <p className="text-sm text-gray-500">Cette transaction se répète automatiquement</p>
                            </div>
                            <Switch
                                id="recurring"
                                checked={formData.isRecurring}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRecurring: checked }))}
                            />
                        </div>

                        {/* Pattern de récurrence */}
                        {formData.isRecurring && (
                            <div className="space-y-2">
                                <Label htmlFor="pattern">Fréquence</Label>
                                <Select value={formData.recurringPattern} onValueChange={(value) => setFormData(prev => ({ ...prev, recurringPattern: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner une fréquence" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Quotidienne</SelectItem>
                                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                                        <SelectItem value="monthly">Mensuelle</SelectItem>
                                        <SelectItem value="yearly">Annuelle</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Tags */}
                        <div className="space-y-2">
                            <Label>Tags</Label>
                            <div className="flex space-x-2">
                                <Input
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    placeholder="Ajouter un tag"
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                />
                                <Button type="button" onClick={addTag} size="sm">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                            {formData.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.tags.map(tag => (
                                        <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                                            <span>{tag}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="ml-1 hover:text-red-600"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
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
                        {saving ? 'Sauvegarde...' : 'Créer la transaction'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
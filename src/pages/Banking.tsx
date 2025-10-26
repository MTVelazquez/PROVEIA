import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlaidLink } from '@/components/PlaidLink';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Building2, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  DollarSign,
  Calendar
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useNavigate } from 'react-router-dom';

interface Account {
  id: string;
  institution_name: string;
  account_name: string;
  account_type: string;
  account_subtype: string;
  current_balance: number;
  available_balance: number;
  currency_code: string;
  is_active: boolean;
}

interface Transaction {
  id: string;
  transaction_id: string;
  name: string;
  merchant_name: string | null;
  amount: number;
  date: string;
  category: string[];
  pending: boolean;
  payment_channel: string;
}

export default function Banking() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadAccounts();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
    }
  };

  const loadAccounts = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('plaid_accounts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAccounts(data || []);
      
      if (data && data.length > 0) {
        setSelectedAccount(data[0].id);
        await loadTransactions(data[0].id);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Error al cargar cuentas');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (accountId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('plaid-get-transactions', {
        body: { account_id: accountId }
      });

      if (error) throw error;

      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Error al cargar transacciones');
    }
  };

  const refreshBalances = async () => {
    try {
      setRefreshing(true);
      toast.loading('Actualizando balances...');
      
      const { data, error } = await supabase.functions.invoke('plaid-get-balance');

      if (error) throw error;

      toast.dismiss();
      toast.success('Balances actualizados');
      
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error('Error refreshing balances:', error);
      toast.dismiss();
      toast.error('Error al actualizar balances');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAccountSelect = async (accountId: string) => {
    setSelectedAccount(accountId);
    await loadTransactions(accountId);
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto p-8 pt-28">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Cargando...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-8 pt-28">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">Finanzas B2B</h1>
              <p className="text-muted-foreground mt-2">
                Administra tus cuentas bancarias y transacciones
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={refreshBalances} 
                disabled={refreshing || accounts.length === 0}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <PlaidLink onSuccess={loadAccounts} />
            </div>
          </div>

          {accounts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay cuentas conectadas</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  Conecta tu cuenta bancaria para comenzar a ver tus transacciones y balance
                </p>
                <PlaidLink onSuccess={loadAccounts} />
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Balance Total */}
              <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Balance Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{formatCurrency(totalBalance)}</p>
                  <p className="text-sm opacity-90 mt-2">
                    {accounts.length} cuenta{accounts.length !== 1 ? 's' : ''} conectada{accounts.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              {/* Cuentas */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Tus Cuentas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accounts.map((account) => (
                    <Card 
                      key={account.id}
                      className={`cursor-pointer transition-all ${
                        selectedAccount === account.id 
                          ? 'ring-2 ring-primary' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => handleAccountSelect(account.id)}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            {account.account_name}
                          </span>
                          {selectedAccount === account.id && (
                            <Badge>Seleccionada</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{account.institution_name}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Balance Actual</p>
                            <p className="text-2xl font-bold">
                              {formatCurrency(account.current_balance, account.currency_code)}
                            </p>
                          </div>
                          {account.available_balance && (
                            <div>
                              <p className="text-sm text-muted-foreground">Balance Disponible</p>
                              <p className="text-lg">
                                {formatCurrency(account.available_balance, account.currency_code)}
                              </p>
                            </div>
                          )}
                          <Badge variant="outline" className="capitalize">
                            {account.account_type} • {account.account_subtype}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Transacciones */}
              {selectedAccount && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Transacciones Recientes</h2>
                  <Card>
                    <CardContent className="p-0">
                      {transactions.length === 0 ? (
                        <div className="py-16 text-center text-muted-foreground">
                          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No hay transacciones disponibles</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {transactions.map((transaction) => (
                            <div 
                              key={transaction.id}
                              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full ${
                                  transaction.amount < 0 
                                    ? 'bg-green-100 dark:bg-green-900' 
                                    : 'bg-red-100 dark:bg-red-900'
                                }`}>
                                  {transaction.amount < 0 ? (
                                    <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400" />
                                  ) : (
                                    <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {transaction.merchant_name || transaction.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(transaction.date).toLocaleDateString('es-MX', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </p>
                                    {transaction.pending && (
                                      <Badge variant="secondary" className="text-xs">
                                        Pendiente
                                      </Badge>
                                    )}
                                  </div>
                                  {transaction.category && transaction.category.length > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {transaction.category.join(', ')}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-lg font-semibold ${
                                  transaction.amount < 0 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {transaction.amount < 0 ? '+' : '-'}
                                  {formatCurrency(Math.abs(transaction.amount))}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {transaction.payment_channel}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

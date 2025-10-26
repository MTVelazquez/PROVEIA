import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Building2,
  Calendar
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useNavigate } from 'react-router-dom';

interface Payment {
  id: string;
  provider_id: string;
  provider_name: string;
  amount: number;
  currency: string;
  status: string;
  payment_intent_id: string;
  payment_method: string | null;
  description: string | null;
  created_at: string;
}

interface Stats {
  total_payments: number;
  total_paid: number;
  total_pending: number;
  succeeded: number;
  pending: number;
  failed: number;
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadPayments();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
    }
  };

  const loadPayments = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('stripe-get-payments');

      if (error) throw error;

      setPayments(data.payments || []);
      setStats(data.stats);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'MXN') => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Exitoso</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Fallido</Badge>;
      case 'canceled':
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto p-8 pt-28">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <DollarSign className="h-8 w-8 animate-pulse mx-auto mb-4" />
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
          <div>
            <h1 className="text-4xl font-bold">Historial de Pagos</h1>
            <p className="text-muted-foreground mt-2">
              Gestiona y revisa tus pagos a proveedores
            </p>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.total_paid)}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.succeeded} pagos exitosos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.total_pending)}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.pending} pagos pendientes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Pagos</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_payments}</div>
                  <p className="text-xs text-muted-foreground">
                    Todos los pagos registrados
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payments List */}
          <Card>
            <CardHeader>
              <CardTitle>Pagos Recientes</CardTitle>
              <CardDescription>Lista de todos tus pagos a proveedores</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay pagos registrados</p>
                </div>
              ) : (
                <div className="divide-y">
                  {payments.map((payment) => (
                    <div 
                      key={payment.id}
                      className="flex items-center justify-between p-6 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-primary/10">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{payment.provider_name}</p>
                          {payment.description && (
                            <p className="text-sm text-muted-foreground">{payment.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(payment.created_at).toLocaleDateString('es-MX', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {payment.payment_method && (
                              <p className="text-xs text-muted-foreground">
                                ID: {payment.payment_method.slice(-4)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <p className="text-2xl font-bold">
                          {formatCurrency(payment.amount, payment.currency)}
                        </p>
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}

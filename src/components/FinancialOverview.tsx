import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  DollarSign, 
  TrendingUp, 
  CreditCard,
  ArrowRightLeft,
  Wallet
} from 'lucide-react';

interface FinancialOverviewProps {
  totalBalance?: number;
  totalPaid?: number;
  connectedAccounts?: number;
  recentPayments?: number;
}

export const FinancialOverview = ({ 
  totalBalance = 0, 
  totalPaid = 0,
  connectedAccounts = 0,
  recentPayments = 0
}: FinancialOverviewProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const stats = [
    {
      title: 'Balance Total',
      value: formatCurrency(totalBalance),
      description: `${connectedAccounts} cuentas conectadas`,
      icon: Wallet,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      title: 'Total Pagado',
      value: formatCurrency(totalPaid),
      description: `${recentPayments} pagos realizados`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      title: 'Sistema de Pagos',
      value: 'Stripe',
      description: 'Pagos seguros B2B',
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
    {
      title: 'Banking API',
      value: 'Plaid',
      description: 'Cuentas conectadas',
      icon: Building2,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Resumen Financiero B2B</h2>
        <p className="text-muted-foreground">
          Panel integrado con Capital One fintech APIs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Integración Completa
              </CardTitle>
              <CardDescription className="mt-2">
                Sistema de pagos B2B con múltiples APIs financieras
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-primary border-primary">
              Capital One Hackathon
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Plaid Banking</p>
                <p className="text-sm text-muted-foreground">
                  Conexión bancaria y transacciones
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Stripe Payments</p>
                <p className="text-sm text-muted-foreground">
                  Pagos seguros a proveedores
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ArrowRightLeft className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Market Data</p>
                <p className="text-sm text-muted-foreground">
                  Tasas de cambio y acciones
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

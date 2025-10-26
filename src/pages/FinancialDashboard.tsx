import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  RefreshCw,
  ArrowRightLeft,
  BarChart3,
  Globe
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface StockData {
  symbol: string;
  price: string;
  change: string;
  changePercent: string;
  high: string;
  low: string;
  volume: string;
}

interface ExchangeRate {
  currency: string;
  rate: number;
  name: string;
}

export default function FinancialDashboard() {
  const [stockSymbol, setStockSymbol] = useState('AAPL');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [loadingRates, setLoadingRates] = useState(false);
  
  const [convertFrom, setConvertFrom] = useState('USD');
  const [convertTo, setConvertTo] = useState('MXN');
  const [convertAmount, setConvertAmount] = useState('1000');
  const [conversionResult, setConversionResult] = useState<any>(null);

  useEffect(() => {
    fetchStockData();
    fetchExchangeRates();
  }, []);

  const fetchStockData = async (symbol: string = stockSymbol) => {
    try {
      setLoadingStock(true);
      
      const { data, error } = await supabase.functions.invoke('alpha-vantage-stock', {
        body: { symbol: symbol.toUpperCase() }
      });

      if (error) throw error;

      const quote = data['Global Quote'];
      if (quote) {
        setStockData({
          symbol: quote['01. symbol'],
          price: quote['05. price'],
          change: quote['09. change'],
          changePercent: quote['10. change percent'],
          high: quote['03. high'],
          low: quote['04. low'],
          volume: quote['06. volume'],
        });
      } else {
        toast.error('No se encontró información para este símbolo');
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
      toast.error('Error al obtener datos de acciones');
    } finally {
      setLoadingStock(false);
    }
  };

  const fetchExchangeRates = async () => {
    try {
      setLoadingRates(true);
      
      const { data, error } = await supabase.functions.invoke('exchange-rate-latest', {
        body: { base_currency: 'USD' }
      });

      if (error) throw error;

      const rates: ExchangeRate[] = [
        { currency: 'MXN', rate: data.conversion_rates.MXN, name: 'Peso Mexicano' },
        { currency: 'EUR', rate: data.conversion_rates.EUR, name: 'Euro' },
        { currency: 'GBP', rate: data.conversion_rates.GBP, name: 'Libra Esterlina' },
        { currency: 'CAD', rate: data.conversion_rates.CAD, name: 'Dólar Canadiense' },
        { currency: 'CNY', rate: data.conversion_rates.CNY, name: 'Yuan Chino' },
        { currency: 'JPY', rate: data.conversion_rates.JPY, name: 'Yen Japonés' },
      ];

      setExchangeRates(rates);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      toast.error('Error al obtener tasas de cambio');
    } finally {
      setLoadingRates(false);
    }
  };

  const handleConvert = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('exchange-rate-convert', {
        body: {
          from: convertFrom,
          to: convertTo,
          amount: parseFloat(convertAmount)
        }
      });

      if (error) throw error;

      setConversionResult(data);
      toast.success('Conversión realizada');
    } catch (error) {
      console.error('Error converting currency:', error);
      toast.error('Error al convertir moneda');
    }
  };

  const formatNumber = (num: string | number) => {
    const number = typeof num === 'string' ? parseFloat(num) : num;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number);
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-8 pt-28">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold">Dashboard Financiero</h1>
            <p className="text-muted-foreground mt-2">
              Información en tiempo real de mercados y divisas
            </p>
          </div>

          <Tabs defaultValue="stocks" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="stocks" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Acciones
              </TabsTrigger>
              <TabsTrigger value="rates" className="gap-2">
                <Globe className="h-4 w-4" />
                Tasas de Cambio
              </TabsTrigger>
              <TabsTrigger value="converter" className="gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                Conversor
              </TabsTrigger>
            </TabsList>

            {/* Stocks Tab */}
            <TabsContent value="stocks" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Buscar Acción</CardTitle>
                  <CardDescription>Ingresa el símbolo de la acción (ej: AAPL, GOOGL, TSLA)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      value={stockSymbol}
                      onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
                      placeholder="Símbolo (ej: AAPL)"
                      className="max-w-xs"
                      onKeyPress={(e) => e.key === 'Enter' && fetchStockData()}
                    />
                    <Button 
                      onClick={() => fetchStockData()}
                      disabled={loadingStock}
                      className="gap-2"
                    >
                      {loadingStock ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <BarChart3 className="h-4 w-4" />
                      )}
                      Buscar
                    </Button>
                  </div>

                  {stockData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Precio Actual
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">
                            ${formatNumber(stockData.price)}
                          </div>
                          <div className={`flex items-center gap-1 mt-2 ${
                            parseFloat(stockData.change) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {parseFloat(stockData.change) >= 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            <span className="font-semibold">
                              {formatNumber(stockData.change)} ({stockData.changePercent})
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Rango del Día
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <span className="text-sm text-muted-foreground">Alto:</span>
                            <p className="text-xl font-semibold">${formatNumber(stockData.high)}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Bajo:</span>
                            <p className="text-xl font-semibold">${formatNumber(stockData.low)}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Volumen
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('en-US', {
                              notation: 'compact',
                              maximumFractionDigits: 1
                            }).format(parseInt(stockData.volume))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Exchange Rates Tab */}
            <TabsContent value="rates" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Tasas de Cambio (USD)</h2>
                  <p className="text-muted-foreground">Actualizado en tiempo real</p>
                </div>
                <Button 
                  onClick={fetchExchangeRates}
                  disabled={loadingRates}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingRates ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exchangeRates.map((rate) => (
                  <Card key={rate.currency}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">
                        {rate.name}
                      </CardTitle>
                      <Badge variant="outline">{rate.currency}</Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatNumber(rate.rate)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        1 USD = {formatNumber(rate.rate)} {rate.currency}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Currency Converter Tab */}
            <TabsContent value="converter" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowRightLeft className="h-5 w-5" />
                    Conversor de Divisas
                  </CardTitle>
                  <CardDescription>Convierte entre diferentes monedas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="from">Desde</Label>
                      <Input
                        id="from"
                        value={convertFrom}
                        onChange={(e) => setConvertFrom(e.target.value.toUpperCase())}
                        placeholder="USD"
                        maxLength={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="to">Hasta</Label>
                      <Input
                        id="to"
                        value={convertTo}
                        onChange={(e) => setConvertTo(e.target.value.toUpperCase())}
                        placeholder="MXN"
                        maxLength={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Cantidad</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={convertAmount}
                        onChange={(e) => setConvertAmount(e.target.value)}
                        placeholder="1000"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleConvert}
                    className="w-full gap-2"
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                    Convertir
                  </Button>

                  {conversionResult && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="pt-6">
                        <div className="text-center space-y-3">
                          <div className="flex items-center justify-center gap-3">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">{conversionResult.from_currency}</p>
                              <p className="text-2xl font-bold">
                                {formatCurrency(conversionResult.amount, conversionResult.from_currency)}
                              </p>
                            </div>
                            <ArrowRightLeft className="h-6 w-6 text-primary" />
                            <div className="text-left">
                              <p className="text-sm text-muted-foreground">{conversionResult.to_currency}</p>
                              <p className="text-2xl font-bold text-primary">
                                {formatCurrency(conversionResult.conversion_result, conversionResult.to_currency)}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Tasa: 1 {conversionResult.from_currency} = {formatNumber(conversionResult.conversion_rate)} {conversionResult.to_currency}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
}

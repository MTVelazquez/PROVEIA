import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { SimpleStripeForm } from '@/components/SimpleStripeForm';
import { DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SimplePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  providerName: string;
}

export const SimplePaymentDialog = ({ 
  open, 
  onOpenChange, 
  providerId, 
  providerName 
}: SimplePaymentDialogProps) => {
  const [amount, setAmount] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [step, setStep] = useState<'amount' | 'payment'>('amount');

  const handleContinue = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      toast.error('Por favor ingresa un monto válido');
      return;
    }

    if (amountNum < 10) {
      toast.error('El monto mínimo es de $10.00 MXN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('=== INICIANDO PROCESO DE PAGO ===');
      console.log('Monto:', amountNum);
      console.log('Proveedor:', providerName, '(ID:', providerId, ')');

      const { data, error: invokeError } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: amountNum,
          provider_id: providerId,
          provider_name: providerName,
        }
      });

      console.log('=== RESPUESTA DE EDGE FUNCTION ===');
      console.log('Data:', data);
      console.log('Error:', invokeError);

      if (invokeError) {
        throw new Error(invokeError.message || 'Error al crear el pago');
      }

      if (!data || !data.clientSecret) {
        throw new Error('No se recibió el client secret del servidor');
      }

      console.log('✅ Client secret recibido correctamente');
      setClientSecret(data.clientSecret);
      setStep('payment');
    } catch (err) {
      console.error('❌ ERROR EN PROCESO DE PAGO:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    console.log('✅ PAGO COMPLETADO EXITOSAMENTE');
    setAmount('');
    setClientSecret('');
    setStep('amount');
    setError('');
    onOpenChange(false);
    toast.success('¡Pago exitoso!');
  };

  const handleCancel = () => {
    console.log('Usuario canceló el pago');
    setStep('amount');
    setClientSecret('');
    setError('');
  };

  const handleClose = () => {
    setAmount('');
    setClientSecret('');
    setStep('amount');
    setError('');
    onOpenChange(false);
  };

  const formatCurrency = (value: string) => {
    const number = parseFloat(value);
    if (isNaN(number)) return '';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(number);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pagar a {providerName}
          </DialogTitle>
          <DialogDescription>
            {step === 'amount' ? 'Ingresa el monto a pagar' : 'Completa los datos de tu tarjeta'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Error al procesar el pago</p>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          </div>
        )}

        {step === 'amount' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto (MXN)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="10.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="10"
                step="0.01"
                autoFocus
              />
              {amount && parseFloat(amount) > 0 && (
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(amount)}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleContinue}
                disabled={!amount || parseFloat(amount) < 10 || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Cargando...
                  </>
                ) : (
                  'Continuar'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">Vas a pagar</p>
              <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
              <p className="text-sm text-muted-foreground mt-1">a {providerName}</p>
            </div>

            {clientSecret ? (
              <SimpleStripeForm
                clientSecret={clientSecret}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

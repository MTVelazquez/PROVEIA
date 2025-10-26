import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface CheckoutFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CheckoutForm = ({ onSuccess, onCancel }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    console.log('CheckoutForm montado. Stripe:', !!stripe, 'Elements:', !!elements);
  }, [stripe, elements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.error('Stripe o Elements no disponible');
      toast.error('Sistema de pagos no disponible');
      return;
    }

    if (!ready) {
      toast.error('Espera a que el formulario termine de cargar');
      return;
    }

    setLoading(true);
    console.log('Iniciando confirmación de pago...');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payments`,
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('Error de Stripe:', error);
        toast.error(error.message || 'Error al procesar el pago');
        setLoading(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Pago confirmado exitosamente. Payment Intent ID:', paymentIntent.id);
        
        // Actualizar el status del pago en la base de datos
        const { error: updateError } = await supabase
          .from('payments')
          .update({ status: 'succeeded' })
          .eq('payment_intent_id', paymentIntent.id);

        if (updateError) {
          console.error('Error actualizando status del pago:', updateError);
        } else {
          console.log('Status del pago actualizado a succeeded');
        }
        
        toast.success('¡Pago procesado exitosamente!');
        onSuccess();
      }
    } catch (err) {
      console.error('Error inesperado:', err);
      toast.error('Error inesperado al procesar el pago');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="min-h-[250px]">
        <PaymentElement 
          onReady={() => {
            console.log('PaymentElement está listo');
            setReady(true);
          }}
          options={{
            layout: 'tabs'
          }}
        />
      </div>
      <div className="flex gap-3 sticky bottom-0 bg-background pt-4 pb-2">
        <Button 
          type="submit" 
          disabled={!stripe || !ready || loading} 
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Procesando...
            </>
          ) : (
            'Pagar Ahora'
          )}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          disabled={loading}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
};

interface SimpleStripeFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const SimpleStripeForm = ({ clientSecret, onSuccess, onCancel }: SimpleStripeFormProps) => {
  console.log('SimpleStripeForm renderizado con clientSecret:', clientSecret ? 'presente' : 'ausente');

  if (!clientSecret) {
    console.error('No hay clientSecret disponible');
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error: No se pudo inicializar el formulario de pago</p>
      </div>
    );
  }

  return (
    <Elements 
      stripe={stripePromise} 
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0066cc',
            borderRadius: '8px',
          },
        },
        locale: 'es',
      }}
    >
      <CheckoutForm onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
};

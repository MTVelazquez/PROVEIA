import { useCallback, useEffect, useState } from 'react';
import { usePlaidLink, PlaidLinkOnSuccess, PlaidLinkOptions } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Building2 } from 'lucide-react';

interface PlaidLinkProps {
  onSuccess?: () => void;
}

export const PlaidLink = ({ onSuccess }: PlaidLinkProps) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    createLinkToken();
  }, []);

  const createLinkToken = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('plaid-create-link-token');
      
      if (error) throw error;
      
      if (data.link_token) {
        setLinkToken(data.link_token);
      } else {
        throw new Error('No se pudo crear el token de enlace');
      }
    } catch (error) {
      console.error('Error creating link token:', error);
      toast.error('Error al inicializar Plaid');
    } finally {
      setLoading(false);
    }
  };

  const onPlaidSuccess = useCallback<PlaidLinkOnSuccess>(
    async (public_token, metadata) => {
      try {
        setLoading(true);
        toast.loading('Conectando tu cuenta bancaria...');
        
        const { data, error } = await supabase.functions.invoke('plaid-exchange-token', {
          body: { public_token, metadata }
        });

        if (error) throw error;

        toast.dismiss();
        toast.success(data.message || 'Cuenta conectada exitosamente');
        
        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        console.error('Error exchanging token:', error);
        toast.dismiss();
        toast.error('Error al conectar la cuenta');
      } finally {
        setLoading(false);
      }
    },
    [onSuccess]
  );

  const config: PlaidLinkOptions = {
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: (err) => {
      if (err) {
        console.error('Plaid Link exited with error:', err);
        toast.error('Se canceló la conexión');
      }
    },
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <Button 
      onClick={() => open()} 
      disabled={!ready || loading}
      className="gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Conectando...
        </>
      ) : (
        <>
          <Building2 className="h-4 w-4" />
          Conectar Cuenta Bancaria
        </>
      )}
    </Button>
  );
};

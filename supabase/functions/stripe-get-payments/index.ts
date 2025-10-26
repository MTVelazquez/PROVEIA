import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Getting payments for user:', user.id);

    // Get payments from database
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (paymentsError) {
      throw new Error(`Database error: ${paymentsError.message}`);
    }

    // Calculate statistics
    const totalPaid = payments
      ?.filter(p => p.status === 'succeeded')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

    const totalPending = payments
      ?.filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

    return new Response(JSON.stringify({
      payments: payments || [],
      stats: {
        total_payments: payments?.length || 0,
        total_paid: totalPaid,
        total_pending: totalPending,
        succeeded: payments?.filter(p => p.status === 'succeeded').length || 0,
        pending: payments?.filter(p => p.status === 'pending').length || 0,
        failed: payments?.filter(p => p.status === 'failed').length || 0,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error getting payments:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

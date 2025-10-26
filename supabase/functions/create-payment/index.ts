import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== CREATE PAYMENT STARTED ===');

    // Parse request body
    const { amount, provider_id, provider_name } = await req.json();
    console.log('Datos recibidos:', { amount, provider_id, provider_name });

    // Validate input
    if (!amount || amount <= 0) {
      throw new Error('Monto inválido');
    }

    if (!provider_name) {
      throw new Error('Nombre del proveedor requerido');
    }

    // Get environment variables
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!STRIPE_SECRET_KEY) {
      throw new Error('Stripe no configurado');
    }

    // Get user from auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No autenticado');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error('Error de autenticación:', userError);
      throw new Error('Usuario no autenticado');
    }

    console.log('Usuario autenticado:', user.id);

    // Initialize Stripe
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get or create Stripe customer
    let customerId: string;
    
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingCustomer?.stripe_customer_id) {
      customerId = existingCustomer.stripe_customer_id;
      console.log('Cliente Stripe existente:', customerId);
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      console.log('Nuevo cliente Stripe creado:', customerId);

      await supabase.from('stripe_customers').insert({
        user_id: user.id,
        stripe_customer_id: customerId,
        email: user.email,
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'mxn',
      customer: customerId,
      description: `Pago a ${provider_name}`,
      metadata: {
        user_id: user.id,
        provider_id: provider_id || '',
        provider_name: provider_name,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('Payment intent creado:', paymentIntent.id);

    // Store in database
    await supabase.from('payments').insert({
      user_id: user.id,
      provider_id: provider_id,
      provider_name: provider_name,
      amount: amount,
      currency: 'MXN',
      status: 'pending',
      payment_intent_id: paymentIntent.id,
    });

    console.log('=== PAYMENT CREATED SUCCESSFULLY ===');

    return new Response(JSON.stringify({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== ERROR ===', error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

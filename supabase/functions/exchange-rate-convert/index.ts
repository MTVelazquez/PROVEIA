import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { from = 'USD', to = 'MXN', amount = 1 } = await req.json();

    const EXCHANGE_RATE_API_KEY = Deno.env.get('EXCHANGE_RATE_API_KEY');

    if (!EXCHANGE_RATE_API_KEY) {
      throw new Error('Exchange Rate API key not configured');
    }

    console.log('Converting:', amount, from, 'to', to);

    // Fetch exchange rates from Exchange Rate API
    const url = `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}/pair/${from}/${to}/${amount}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Exchange Rate API error: ${response.status}`);
    }

    const data = await response.json();

    // Check for API errors
    if (data.result === 'error') {
      throw new Error(data['error-type'] || 'API Error');
    }

    console.log('Conversion successful:', data.conversion_result);

    return new Response(JSON.stringify({
      from_currency: from,
      to_currency: to,
      amount: amount,
      conversion_rate: data.conversion_rate,
      conversion_result: data.conversion_result,
      last_update: data.time_last_update_utc,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error converting currency:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

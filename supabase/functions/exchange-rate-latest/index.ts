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
    const { base_currency = 'USD' } = await req.json();

    const EXCHANGE_RATE_API_KEY = Deno.env.get('EXCHANGE_RATE_API_KEY');

    if (!EXCHANGE_RATE_API_KEY) {
      throw new Error('Exchange Rate API key not configured');
    }

    console.log('Fetching latest rates for:', base_currency);

    // Fetch latest exchange rates
    const url = `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}/latest/${base_currency}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Exchange Rate API error: ${response.status}`);
    }

    const data = await response.json();

    // Check for API errors
    if (data.result === 'error') {
      throw new Error(data['error-type'] || 'API Error');
    }

    console.log('Latest rates retrieved successfully');

    // Return most relevant currencies for Mexico/Latin America B2B
    const relevantCurrencies = {
      MXN: data.conversion_rates.MXN,
      EUR: data.conversion_rates.EUR,
      GBP: data.conversion_rates.GBP,
      CAD: data.conversion_rates.CAD,
      CNY: data.conversion_rates.CNY,
      JPY: data.conversion_rates.JPY,
    };

    return new Response(JSON.stringify({
      base_code: data.base_code,
      time_last_update: data.time_last_update_utc,
      conversion_rates: relevantCurrencies,
      all_rates: data.conversion_rates,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

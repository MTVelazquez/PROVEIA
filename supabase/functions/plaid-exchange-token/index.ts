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
    const { public_token, metadata } = await req.json();

    const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID');
    const PLAID_SECRET = Deno.env.get('PLAID_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
      throw new Error('Plaid credentials not configured');
    }

    if (!public_token) {
      throw new Error('Public token is required');
    }

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

    console.log('Exchanging public token for user:', user.id);

    // Exchange public token for access token
    const tokenResponse = await fetch('https://sandbox.plaid.com/item/public_token/exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        public_token: public_token,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Plaid token exchange error:', errorData);
      throw new Error(`Plaid API error: ${errorData}`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, item_id } = tokenData;

    console.log('Token exchange successful, getting account details');

    // Get account details
    const accountsResponse = await fetch('https://sandbox.plaid.com/accounts/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: access_token,
      }),
    });

    if (!accountsResponse.ok) {
      const errorData = await accountsResponse.text();
      console.error('Plaid accounts error:', errorData);
      throw new Error(`Plaid API error: ${errorData}`);
    }

    const accountsData = await accountsResponse.json();
    console.log('Retrieved accounts:', accountsData.accounts.length);

    // Store accounts in database
    const accountsToInsert = accountsData.accounts.map((account: any) => ({
      user_id: user.id,
      access_token: access_token,
      item_id: item_id,
      institution_id: metadata?.institution?.institution_id || null,
      institution_name: metadata?.institution?.name || null,
      account_id: account.account_id,
      account_name: account.name,
      account_type: account.type,
      account_subtype: account.subtype,
      available_balance: account.balances.available,
      current_balance: account.balances.current,
      currency_code: account.balances.iso_currency_code || 'USD',
      is_active: true,
    }));

    const { data: insertedAccounts, error: insertError } = await supabase
      .from('plaid_accounts')
      .insert(accountsToInsert)
      .select();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }

    console.log('Successfully stored accounts in database');

    return new Response(JSON.stringify({ 
      success: true,
      accounts: insertedAccounts,
      message: 'Cuentas conectadas exitosamente'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error exchanging token:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

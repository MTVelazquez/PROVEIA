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
    const { account_id, start_date, end_date } = await req.json();

    const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID');
    const PLAID_SECRET = Deno.env.get('PLAID_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
      throw new Error('Plaid credentials not configured');
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

    console.log('Getting transactions for user:', user.id);

    // Get account from database
    const { data: account, error: accountError } = await supabase
      .from('plaid_accounts')
      .select('*')
      .eq('id', account_id)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      throw new Error('Account not found');
    }

    // Calculate date range (last 30 days if not provided)
    const endDate = end_date || new Date().toISOString().split('T')[0];
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log('Fetching transactions from', startDate, 'to', endDate);

    // Get transactions from Plaid
    const transactionsResponse = await fetch('https://sandbox.plaid.com/transactions/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: account.access_token,
        start_date: startDate,
        end_date: endDate,
        options: {
          account_ids: [account.account_id],
          count: 500,
          offset: 0,
        },
      }),
    });

    if (!transactionsResponse.ok) {
      const errorData = await transactionsResponse.text();
      console.error('Plaid transactions error:', errorData);
      throw new Error(`Plaid API error: ${errorData}`);
    }

    const transactionsData = await transactionsResponse.json();
    console.log('Retrieved transactions:', transactionsData.transactions.length);

    // Store new transactions in database (upsert to avoid duplicates)
    const transactionsToUpsert = transactionsData.transactions.map((tx: any) => ({
      user_id: user.id,
      plaid_account_id: account.id,
      transaction_id: tx.transaction_id,
      amount: tx.amount,
      date: tx.date,
      name: tx.name,
      merchant_name: tx.merchant_name || null,
      category: tx.category || [],
      pending: tx.pending,
      payment_channel: tx.payment_channel,
    }));

    if (transactionsToUpsert.length > 0) {
      const { error: upsertError } = await supabase
        .from('plaid_transactions')
        .upsert(transactionsToUpsert, { 
          onConflict: 'transaction_id',
          ignoreDuplicates: false 
        });

      if (upsertError) {
        console.error('Database upsert error:', upsertError);
        throw new Error(`Database error: ${upsertError.message}`);
      }
    }

    // Get all transactions from database for this account
    const { data: allTransactions, error: selectError } = await supabase
      .from('plaid_transactions')
      .select('*')
      .eq('plaid_account_id', account.id)
      .order('date', { ascending: false })
      .limit(100);

    if (selectError) {
      console.error('Database select error:', selectError);
      throw new Error(`Database error: ${selectError.message}`);
    }

    return new Response(JSON.stringify({ 
      transactions: allTransactions,
      total_transactions: transactionsData.total_transactions,
      account: {
        name: account.account_name,
        balance: account.current_balance,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error getting transactions:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

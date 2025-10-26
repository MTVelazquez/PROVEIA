-- Create table for storing Plaid connected accounts
CREATE TABLE public.plaid_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  item_id TEXT NOT NULL,
  institution_id TEXT,
  institution_name TEXT,
  account_id TEXT,
  account_name TEXT,
  account_type TEXT,
  account_subtype TEXT,
  available_balance DECIMAL(15,2),
  current_balance DECIMAL(15,2),
  currency_code TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_plaid_accounts_user_id ON public.plaid_accounts(user_id);
CREATE INDEX idx_plaid_accounts_item_id ON public.plaid_accounts(item_id);

-- Enable Row Level Security
ALTER TABLE public.plaid_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own accounts" 
ON public.plaid_accounts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts" 
ON public.plaid_accounts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts" 
ON public.plaid_accounts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts" 
ON public.plaid_accounts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create table for storing transactions
CREATE TABLE public.plaid_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_account_id UUID NOT NULL REFERENCES public.plaid_accounts(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL UNIQUE,
  amount DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  merchant_name TEXT,
  category TEXT[],
  pending BOOLEAN DEFAULT false,
  payment_channel TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX idx_plaid_transactions_user_id ON public.plaid_transactions(user_id);
CREATE INDEX idx_plaid_transactions_account_id ON public.plaid_transactions(plaid_account_id);
CREATE INDEX idx_plaid_transactions_date ON public.plaid_transactions(date DESC);

-- Enable Row Level Security
ALTER TABLE public.plaid_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own transactions" 
ON public.plaid_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" 
ON public.plaid_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" 
ON public.plaid_transactions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_plaid_accounts_updated_at
BEFORE UPDATE ON public.plaid_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plaid_transactions_updated_at
BEFORE UPDATE ON public.plaid_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
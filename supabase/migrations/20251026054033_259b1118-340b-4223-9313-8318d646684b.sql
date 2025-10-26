-- Create profiles for existing users manually
INSERT INTO public.profiles (id, full_name, avatar_url)
VALUES 
  ('bd1b9e00-0f8a-4342-a364-0842fd452c47', 'Marcelo Treviño', 'https://lh3.googleusercontent.com/a/ACg8ocI7l70TXAjUBaXyBwdDFbwXtMVfFvf1tjdG9xJH1ugxx7YCCr8=s96-c'),
  ('91273595-ceb3-43fb-9c8e-2d03a6841264', 'Camila Portanda', 'https://lh3.googleusercontent.com/a/ACg8ocJyJ1EyHYsl3nQzntDQJIO0cC_smbw8aVvkZUVtH0FiItNDwA=s96-c')
ON CONFLICT (id) DO UPDATE 
SET 
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url;
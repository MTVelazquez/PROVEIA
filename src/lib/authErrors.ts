/**
 * Sanitizes authentication error messages to prevent information leakage
 * Maps technical Supabase errors to user-friendly Spanish messages
 */
export const sanitizeAuthError = (error: any): string => {
  // Log full error for debugging (only in development)
  if (import.meta.env.DEV) {
    console.error('[Auth Error]', error);
  }
  
  // Map known error messages to safe user messages
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Email o contraseña incorrectos',
    'Email not confirmed': 'Por favor confirma tu email',
    'User already registered': 'Este email ya está registrado',
    'Invalid email': 'Email inválido',
    'Email rate limit exceeded': 'Demasiados intentos. Por favor espera un momento',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
  };
  
  // Check if we have a mapped message for this error
  if (error?.message && errorMap[error.message]) {
    return errorMap[error.message];
  }
  
  // Generic fallback - never expose technical details
  return 'Error en la autenticación. Por favor intenta nuevamente.';
};

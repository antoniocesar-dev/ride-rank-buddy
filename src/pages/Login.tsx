import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Minimum delay between submissions (ms) — client-side guard complementing
// Supabase's server-side rate limiting on auth endpoints.
const SUBMIT_COOLDOWN_MS = 1000;

export default function Login() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmit, setLastSubmit] = useState(0);

  // Already authenticated → skip login screen
  if (!loading && session) {
    const from = (location.state as { from?: Location })?.from?.pathname ?? '/';
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side cooldown (does not replace server-side rate limiting)
    const now = Date.now();
    if (now - lastSubmit < SUBMIT_COOLDOWN_MS) return;
    setLastSubmit(now);

    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        // Normalize Supabase error messages to Portuguese without leaking internals
        if (
          error.message.includes('Invalid login credentials') ||
          error.message.includes('invalid_credentials')
        ) {
          setError('E-mail ou senha incorretos.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('E-mail ainda não confirmado. Verifique sua caixa de entrada.');
        } else if (error.message.includes('rate limit') || error.status === 429) {
          setError('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
        } else {
          setError('Erro ao autenticar. Tente novamente.');
        }
        return;
      }

      // onAuthStateChange in AuthContext updates session → ProtectedRoute unblocks
      const from = (location.state as { from?: Location })?.from?.pathname ?? '/';
      navigate(from, { replace: true });
    } catch {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Brand header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center justify-center rounded-xl bg-primary p-3 text-primary-foreground shadow">
            <Trophy className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Ride Rank</h1>
          <p className="text-sm text-muted-foreground">Sistema de ranking de motoristas</p>
        </div>

        {/* Login card */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">Entrar</CardTitle>
            <CardDescription>Acesse com suas credenciais de operador</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username email"
                  placeholder="operador@empresa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Entrando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </span>
                )}
              </Button>

            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Grupo La Monica · Acesso restrito a operadores
        </p>
      </div>
    </div>
  );
}


'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Login failed',
          description: 'Invalid credentials. Please try again.',
        });
      } else if (result?.ok) {
        toast({
          title: 'Login successful',
          description: 'Welcome back to ProFlow!',
        });
        router.push('/');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="w-full max-w-md relative z-10 px-6">
            <div className="flex flex-col items-center mb-8">
                <div className="rounded-2xl premium-gradient p-3 shadow-2xl shadow-primary/30 mb-4 transform hover:rotate-12 transition-transform duration-500">
                    <Logo />
                </div>
                <h1 className="text-3xl font-black tracking-tighter text-gradient">ProFlow</h1>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-[0.3em] mt-2">Enterprise Productivity</p>
            </div>

            <Card className="border-border/50 bg-card/40 backdrop-blur-2xl shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 premium-gradient" />
                <CardHeader className="space-y-1 pb-8">
                    <CardTitle className="text-xl font-bold">Sign In</CardTitle>
                    <CardDescription className="text-xs font-medium">
                        Welcome back! Please enter your details.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@company.com"
                                className="bg-muted/30 border-border/50 h-11 focus-visible:ring-primary/20"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Password</Label>
                                <Link href="#" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter">Forgot password?</Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                className="bg-muted/30 border-border/50 h-11 focus-visible:ring-primary/20"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full h-11 premium-gradient shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold" disabled={loading}>
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Authenticating...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Sign In <ArrowRight className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </form>
                    
                    <div className="mt-8 flex flex-col items-center gap-4">
                        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <div className="h-px w-8 bg-border" />
                            Secure Access
                            <div className="h-px w-8 bg-border" />
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 font-medium">
                            <ShieldCheck className="h-3 w-3 text-emerald-500" />
                            AES-256 Encrypted Connection
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <p className="mt-8 text-center text-xs font-medium text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/register" className="font-bold text-primary hover:underline">
                    Create one now
                </Link>
            </p>
        </div>
    </div>
  );
}
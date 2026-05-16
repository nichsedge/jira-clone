
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, Lock } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="w-full max-w-md relative z-10 px-6">
            <div className="flex flex-col items-center mb-8">
                <div className="rounded-2xl premium-gradient p-3 shadow-2xl shadow-primary/30 mb-4">
                    <Logo />
                </div>
                <h1 className="text-3xl font-black tracking-tighter text-gradient">ProFlow</h1>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-[0.3em] mt-2">Enterprise Productivity</p>
            </div>

            <Card className="border-border/50 bg-card/40 backdrop-blur-2xl shadow-2xl overflow-hidden relative text-center">
                <div className="absolute top-0 left-0 w-full h-1 premium-gradient" />
                <CardHeader className="space-y-2 pb-8">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                        <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-bold">Registration Locked</CardTitle>
                    <CardDescription className="text-xs font-medium max-w-[250px] mx-auto">
                        Account creation is currently restricted to administrative setup.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-muted/30 border border-border/50 rounded-xl p-6 space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/70">
                            <Info className="h-3 w-3" />
                            Demo Credentials
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-foreground">admin@example.com</p>
                            <p className="text-[10px] font-medium text-muted-foreground">Password: <span className="text-foreground">admin123</span></p>
                        </div>
                    </div>

                    <Button asChild className="w-full h-11 premium-gradient shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold">
                        <Link href="/login">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Return to Sign In
                        </Link>
                    </Button>
                </CardContent>
            </Card>
            
            <p className="mt-8 text-center text-xs font-medium text-muted-foreground italic">
                ProFlow v1.0.4 • © 2026 Enterprise Labs
            </p>
        </div>
    </div>
  );
}
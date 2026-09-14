'use client';

import { useState, type SubmitEvent } from 'react';
import { BriefcaseBusiness, KeyRound, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to sign in.');
      window.location.assign('/');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-mark"><BriefcaseBusiness size={24} /></div>
        <p className="eyebrow">CAREER TRACKER</p>
        <h1 id="login-title">Your job search, protected.</h1>
        <p>Sign in to access your application workspace and saved opportunities.</p>
        <form onSubmit={submit} className="login-form">
          <label htmlFor="login-email">Email</label>
          <Input
            autoComplete="username"
            id="login-email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
          <label htmlFor="login-password">Password</label>
          <Input
            autoComplete="current-password"
            id="login-password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          {error && <p className="login-error" role="alert">{error}</p>}
          <Button disabled={busy} type="submit" className="login-submit">
            <KeyRound size={17} /> {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <div className="login-security"><ShieldCheck size={16} /> Access is role-based and sessions expire automatically.</div>
      </section>
    </main>
  );
}

// Section 25.2 — Google OAuth is the ONLY auth path. One card, one action,
// no password field, no separate signup screen (ui_improvements.md §0).

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { MarketingShell } from '@/components/layout/MarketingShell'
import { Button } from '@/components/ui/button'
import { MonoLabel } from '@/components/common/MonoLabel'
import { useServices } from '@/services/ServiceProvider'
import { GoogleIcon } from './GoogleIcon'

export function AuthPage() {
  const { authService } = useServices()
  const navigate = useNavigate()
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  async function handleContinueWithGoogle() {
    setIsAuthenticating(true)
    // Real flow: Google Identity Services returns a signed ID token, which
    // gets POSTed to /api/auth/google. The mock service stands in for both.
    await authService.loginWithGoogle('mock-google-id-token')
    navigate('/dashboard')
  }

  return (
    <MarketingShell
      header={
        <Link
          to="/"
          className="font-mono text-xs uppercase tracking-[0.12em] text-console-ink-muted hover:text-console-ink"
        >
          ← Back to home
        </Link>
      }
    >
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-sharp border border-console-mint text-console-mint">
              <span className="font-mono text-lg font-bold">⇄</span>
            </div>
            <div>
              <div className="font-mono text-sm font-bold uppercase tracking-[0.14em] text-console-ink">
                FlowSync
              </div>
              <MonoLabel className="text-console-ink-muted">Architectural Access Protocol</MonoLabel>
            </div>
          </div>

          <div className="rounded-sharp border border-console-border bg-console-surface p-6">
            <MonoLabel className="mb-1 block text-console-ink-muted">Identity Verification</MonoLabel>
            <h1 className="mb-6 text-lg font-semibold text-console-ink">Sign in to continue</h1>

            <Button
              variant="console"
              size="lg"
              className="w-full"
              disabled={isAuthenticating}
              onClick={handleContinueWithGoogle}
            >
              <GoogleIcon className="h-4 w-4" />
              {isAuthenticating ? 'Verifying with Google…' : 'Continue with Google'}
            </Button>

            <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-console-ink-muted">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              FlowSync never sees or stores your Google password. There is no separate account or
              password to create — sign in once with Google and you're in.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-console-ink-muted">
            <span>Encryption active</span>
            <span>System v1.0.0-stable</span>
          </div>
        </div>
      </div>
    </MarketingShell>
  )
}

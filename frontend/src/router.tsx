import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { StageTopNav, SubmitSolutionButton } from '@/components/layout/StageTopNav'
import { RouteStub } from '@/components/common/RouteStub'
import { LandingPage } from '@/features/landing/LandingPage'
import { AuthPage } from '@/features/auth/AuthPage'

function AppRoute({ sessionNumber, name }: { sessionNumber: number; name: string }) {
  return (
    <AppShell>
      <RouteStub sessionNumber={sessionNumber} name={name} />
    </AppShell>
  )
}

function StageRoute({ sessionNumber, name }: { sessionNumber: number; name: string }) {
  return (
    <AppShell navSlot={<StageTopNav />} actions={<SubmitSolutionButton />}>
      <RouteStub sessionNumber={sessionNumber} name={name} />
    </AppShell>
  )
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />

      <Route path="/dashboard" element={<AppRoute sessionNumber={5} name="Dashboard / Problem Library" />} />

      <Route
        path="/session/:sessionId/requirements"
        element={<StageRoute sessionNumber={6} name="Stage 1 — Requirements" />}
      />
      <Route
        path="/session/:sessionId/estimation"
        element={<StageRoute sessionNumber={6} name="Stage 2 — Estimation" />}
      />
      <Route path="/session/:sessionId/api" element={<StageRoute sessionNumber={6} name="Stage 3 — API Design" />} />
      <Route
        path="/session/:sessionId/datamodel"
        element={<StageRoute sessionNumber={6} name="Stage 4 — Data Model" />}
      />
      <Route
        path="/session/:sessionId/hld-canvas"
        element={<StageRoute sessionNumber={7} name="Stage 5 — HLD Canvas" />}
      />
      <Route
        path="/session/:sessionId/deep-dive"
        element={<StageRoute sessionNumber={7} name="Stage 6 — Deep Dive" />}
      />

      <Route
        path="/session/:sessionId/challenge"
        element={<AppRoute sessionNumber={8} name="Challenge / Arbitration Duel" />}
      />
      <Route path="/session/:sessionId/report" element={<AppRoute sessionNumber={9} name="Final Report" />} />
      <Route path="/session/:sessionId/replay" element={<AppRoute sessionNumber={9} name="Session Replay" />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

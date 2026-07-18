import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { StageTopNav, SubmitSolutionButton } from '@/components/layout/StageTopNav'
import { RouteStub } from '@/components/common/RouteStub'
import { LandingPage } from '@/features/landing/LandingPage'
import { AuthPage } from '@/features/auth/AuthPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { RequirementsPage } from '@/features/stages/requirements/RequirementsPage'
import { EstimationPage } from '@/features/stages/estimation/EstimationPage'
import { ApiDesignPage } from '@/features/stages/api-design/ApiDesignPage'
import { DataModelPage } from '@/features/stages/data-model/DataModelPage'

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

      <Route
        path="/dashboard"
        element={
          <AppShell>
            <DashboardPage />
          </AppShell>
        }
      />

      <Route
        path="/session/:sessionId/requirements"
        element={
          <AppShell navSlot={<StageTopNav />} actions={<SubmitSolutionButton />}>
            <RequirementsPage />
          </AppShell>
        }
      />
      <Route
        path="/session/:sessionId/estimation"
        element={
          <AppShell navSlot={<StageTopNav />} actions={<SubmitSolutionButton />}>
            <EstimationPage />
          </AppShell>
        }
      />
      <Route
        path="/session/:sessionId/api"
        element={
          <AppShell navSlot={<StageTopNav />} actions={<SubmitSolutionButton />}>
            <ApiDesignPage />
          </AppShell>
        }
      />
      <Route
        path="/session/:sessionId/datamodel"
        element={
          <AppShell navSlot={<StageTopNav />} actions={<SubmitSolutionButton />}>
            <DataModelPage />
          </AppShell>
        }
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

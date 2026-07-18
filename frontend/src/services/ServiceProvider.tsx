import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { AuthService } from './interfaces/AuthService'
import type { ProblemsService } from './interfaces/ProblemsService'
import type { SessionService } from './interfaces/SessionService'
import type { ReviewStreamService } from './interfaces/ReviewStreamService'
import { MockAuthService } from './mock/mockAuthService'
import { MockProblemsService } from './mock/mockProblemsService'
import { MockSessionService } from './mock/mockSessionService'
import { MockReviewStreamService } from './mock/mockReviewStreamService'

export interface Services {
  authService: AuthService
  problemsService: ProblemsService
  sessionService: SessionService
  reviewStreamService: ReviewStreamService
}

function createMockServices(): Services {
  return {
    authService: new MockAuthService(),
    problemsService: new MockProblemsService(),
    sessionService: new MockSessionService(),
    reviewStreamService: new MockReviewStreamService(),
  }
}

const ServiceContext = createContext<Services | null>(null)

export function ServiceProvider({ children }: { children: ReactNode }) {
  // Recreated only once per mount — swapping this factory for one backed by
  // real HTTP/WS clients is the only change needed to go live.
  const services = useMemo(() => createMockServices(), [])
  return <ServiceContext.Provider value={services}>{children}</ServiceContext.Provider>
}

export function useServices(): Services {
  const services = useContext(ServiceContext)
  if (!services) throw new Error('useServices must be used within a ServiceProvider')
  return services
}

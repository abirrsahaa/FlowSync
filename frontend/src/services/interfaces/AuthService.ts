// Section 25.2 — Google OAuth is the only login path. The frontend never
// handles a password; it exchanges a Google ID token for FlowSync's own
// access token via this contract.

import type { User } from '@/domain/user'

export interface AuthResult {
  user: User
  accessToken: string
}

export interface AuthService {
  loginWithGoogle(googleIdToken: string): Promise<AuthResult>
  logout(): Promise<void>
  getCurrentUser(): Promise<User | null>
}

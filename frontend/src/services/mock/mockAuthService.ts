import type { User } from '@/domain/user'
import type { AuthResult, AuthService } from '../interfaces/AuthService'
import { mockUser } from './fixtures'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class MockAuthService implements AuthService {
  private currentUser: User | null = null

  async loginWithGoogle(_googleIdToken: string): Promise<AuthResult> {
    await delay(300)
    this.currentUser = mockUser
    return { user: mockUser, accessToken: 'mock-access-token' }
  }

  async logout(): Promise<void> {
    await delay(100)
    this.currentUser = null
  }

  async getCurrentUser(): Promise<User | null> {
    await delay(50)
    return this.currentUser
  }
}

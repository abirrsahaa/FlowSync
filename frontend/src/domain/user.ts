// Section 25.2 — FlowSync-issued JWT claims / the user record derived from
// Google OAuth (sub, email, name, picture). FlowSync never stores or forwards
// Google's own token past the initial /api/auth/google exchange.

export interface User {
  id: string // internal userId (UUID) — the JWT "sub", not Google's sub
  email: string
  name: string
  picture?: string
  roles: Array<'user' | 'interviewer'>
}

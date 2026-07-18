import type { Checklist, Problem } from '@/domain/problem'

export interface ProblemsService {
  listProblems(): Promise<Problem[]>
  getProblem(problemId: string): Promise<Problem | undefined>
  getChecklist(checklistId: string): Promise<Checklist | undefined>
}

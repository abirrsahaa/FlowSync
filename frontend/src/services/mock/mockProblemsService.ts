import type { Checklist, Problem } from '@/domain/problem'
import type { ProblemsService } from '../interfaces/ProblemsService'
import { checklists, problems } from './fixtures'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class MockProblemsService implements ProblemsService {
  async listProblems(): Promise<Problem[]> {
    await delay(150)
    return problems
  }

  async getProblem(problemId: string): Promise<Problem | undefined> {
    await delay(100)
    return problems.find((p) => p.id === problemId)
  }

  async getChecklist(checklistId: string): Promise<Checklist | undefined> {
    await delay(100)
    return checklists.find((c) => c.checklistId === checklistId)
  }
}

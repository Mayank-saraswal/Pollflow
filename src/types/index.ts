export type PollStatus = 'ACTIVE' | 'EXPIRED' | 'PUBLISHED'
export type VoterMode = 'ANYONE' | 'AUTHENTICATED_ONLY'

export interface Poll {
  id: string
  title: string
  description?: string
  shareToken: string
  status: PollStatus
  voterMode: VoterMode
  isAnonymous: boolean
  isPublished: boolean
  expiresAt?: string
  questions: Question[]
  _count?: { responses: number }
  createdAt: string
}

export interface Question {
  id: string
  pollId: string
  text: string
  isMandatory: boolean
  order: number
  imageUrl?: string
  options: Option[]
}

export interface Option {
  id: string
  questionId: string
  text: string
  imageUrl?: string
  _count?: { answers: number }
}

export interface Response {
  id: string
  pollId: string
  respondentId?: string
  submittedAt: string
  answers: Answer[]
}

export interface Answer {
  id: string
  questionId: string
  optionId: string
}

export interface PollAnalytics {
  totalResponses: number
  participationRate: number
  questionStats: QuestionStat[]
  recentActivity: ActivityPoint[]
}

export interface QuestionStat {
  questionId:   string
  questionText: string
  isMandatory:  boolean
  totalAnswers: number
  optionStats:  OptionStat[]
}

export interface OptionStat {
  optionId: string
  optionText: string
  count: number
  percentage: number
}

export interface ActivityPoint {
  timestamp: string
  count: number
}

// Socket event types
export interface LiveUpdatePayload {
  pollId:         string
  event?:         string
  totalResponses?: number
  questionStats?: QuestionStat[]
}

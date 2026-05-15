export type PollStatus = 'ACTIVE' | 'EXPIRED' | 'PUBLISHED'
export type VoterMode = 'ANYONE' | 'AUTHENTICATED_ONLY'

export interface Poll {
  id: string
  title: string
  description?: string | null
  shareToken: string
  creatorId: string
  status: PollStatus
  voterMode: VoterMode
  isAnonymous: boolean
  isPublished: boolean
  expiresAt?: string | Date | null
  questions: Question[]
  _count?: { responses: number }
  createdAt: string | Date
}

export interface Question {
  id: string
  pollId: string
  text: string
  isMandatory: boolean
  order: number
  imageUrl?: string | null
  options: Option[]
}

export interface Option {
  id: string
  questionId?: string
  text: string
  imageUrl?: string | null
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

// ── Quiz types ──────────────────────────────────────────────────────
export type QuizPhase =
  | 'LOBBY'
  | 'QUESTION_ACTIVE'
  | 'QUESTION_ENDED'
  | 'QUIZ_ENDED'

export interface LiveQuizQuestion {
  id:          string
  text:        string
  imageUrl?:   string | null
  type:        'SINGLE' | 'MULTIPLE'
  timeLimit:   number
  points:      number
  options:     { id: string; text: string; imageUrl?: string | null; order: number }[]
}

export interface LeaderboardEntry {
  rank:          number
  participantId: string
  displayName:   string
  avatarUrl?:    string | null
  score:         number
}

export interface AnswerAck {
  questionId:   string
  accepted:     boolean
  isCorrect:    boolean
  partialRatio: number
  pointsEarned: number
  baseScore:    number
  streakBonus:  number
  streak:       number
  answerTimeMs: number
}

export interface QuizSessionState {
  phase:           QuizPhase
  sessionId:       string
  currentQuestion?: LiveQuizQuestion
  questionIndex?:  number
  totalQuestions?: number
  leaderboard?:    LeaderboardEntry[]
  serverTime?:     number
}

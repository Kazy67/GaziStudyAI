export interface Question {
  id: string;
  text: string;
  options: string[]; // Options ["A", "B", "C", "D"]
  correctOptionIndex: number; // 0, 1, 2, 3
  explanation?: string;
  topic?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export interface ClassicQuestion {
  visualType: string;
  questionText: string;
  inputData: any; // Flexible based on visualType
  solutionData: any; // Flexible based on visualType
  userAnswer?: any; // For storing student input
}

export interface ClassicRequest {
  coursePrefix: string;
  weeks: number[];
  questionCount: number; // 1-5
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface EvaluateClassicRequest {
  visualType: string;
  questionText: string;
  solutionData: any;
  studentData: any;
}

export interface EvaluationResult {
  score: number;
  feedback: string[];
}

export interface ExamConfig {
  startWeek: number;
  endWeek: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionCount: number;
  timerEnabled: boolean;
  recommendedTime: number; // in minutes
}

export interface ExamResult {
  score: number;
  total: number;
  correctAnswers: number;
  wrongAnswers: number;
  feedback: string[];
}

export interface SubmitQuestionDto {
  text: string;
  type: number;
  studentAnswer?: string;
  isCorrect: boolean;
  inputDataJson?: string;
  solutionJson?: string;
}

export interface SubmitExamDto {
  courseId: string;
  sessionId: string;
  attemptNumber: number;
  topic: string;
  questionCount: number;
  score: number;
  difficulty: string;
  questions: SubmitQuestionDto[];
}

export interface ExamHistoryDto {
  examId: string;
  courseNameEn: string;
  courseNameTr: string;
  topic: string;
  score: number;
  createdDate: Date;
  attemptNumber: number;
  questionCount: number;
  difficulty: string;
}

export interface StudentDashboardDto {
  totalExamsTaken: number;
  averageScore: number;
  recentExams: ExamHistoryDto[];
}

export interface MockExamRequest {
  courseId: string;
  examType: string;
}

export interface MockExamResult {
  testQuestions: any[];
  classicQuestions: any[];
}

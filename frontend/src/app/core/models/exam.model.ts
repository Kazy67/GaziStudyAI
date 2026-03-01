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

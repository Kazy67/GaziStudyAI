export interface GenerateTestRequest {
  coursePrefix: string;
  weeks: number[];
  questionCount: number;
  difficulty: string;
}

export interface GeneratedQuestion {
  question: string;
  options: string[];
  answer: string;
}

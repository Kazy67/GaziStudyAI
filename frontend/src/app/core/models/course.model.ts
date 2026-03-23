export interface Course {
  id: string; // Guid -> string
  prefix: string;
  nameTr: string;
  nameEn: string;
  descriptionTr: string;
  descriptionEn: string;
  teacherName: string;
  credits: number | null;
  imageUrl: string | null;
  yearLevel: number;
  studentCount: number;
  allowTheoryQuestions?: boolean;
  allowCodeQuestions?: boolean;
  allowMathQuestions?: boolean;
  weeks: CourseWeek[];
}

export interface CourseWeek {
  weekNumber: number;
  topicTr: string;
  topicEn: string;
}

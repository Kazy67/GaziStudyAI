export interface Course {
  id: string; // Guid -> string
  nameTr: string;
  nameEn: string;
  descriptionTr: string;
  descriptionEn: string;
  teacherName: string;
  credits: number | null;
  imageUrl: string | null;
  yearLevel: number;
  weeks: CourseWeek[];
}

export interface CourseWeek {
  weekNumber: number;
  topicTr: string;
  topicEn: string;
}

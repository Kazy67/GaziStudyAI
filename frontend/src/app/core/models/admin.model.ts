export interface TopStudentDto {
  fullName: string;
  examsTaken: number;
  averageScore: number;
}

export interface CourseStatsDto {
  courseName: string;
  examsTaken: number;
  averageScore: number;
}

export interface AdminDashboardDto {
  totalStudents: number;
  totalExamsGenerated: number;
  averagePlatformScore: number;
  courseStatistics: CourseStatsDto[];
  topStudents: TopStudentDto[];
}

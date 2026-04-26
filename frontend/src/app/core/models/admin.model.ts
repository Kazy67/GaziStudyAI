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

export interface StudentDirectoryItemDto {
  id: string;
  fullName: string;
  email: string;
  studentNumber: string;
  department: string;
  totalExamsTaken: number;
  registeredDate: string;
}

export interface SystemLogDto {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  status: string;
}

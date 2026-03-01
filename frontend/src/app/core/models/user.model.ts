export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  studentNumber?: string;
  department?: string;
  profileImageUrl?: string;
}

export interface UpdateProfileDto {
  firstName: string;
  lastName: string;
  studentNumber?: string;
  department?: string;
  profileImage?: File | null;
  removeExistingImage?: boolean;
}

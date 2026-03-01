export interface ServiceResult<T> {
  data: T | null;
  isSuccess: boolean;
  message: string;
  messageCode: string | null;
  errors: string[] | null;
}

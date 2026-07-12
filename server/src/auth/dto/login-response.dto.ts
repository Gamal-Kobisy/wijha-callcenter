export class UserResponse {
  id!: number;
  email!: string;
  name?: string | null;
  phone?: string | null;
  role!: string;
}

export class LoginResponseDto {
  token!: string;
  user!: UserResponse;
}

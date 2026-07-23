export class UserResponse {
  id!: number;
  email!: string;
  name?: string | null;
  phone?: string | null;
  role!: string;
  profile_image?: string | null;
}

export class LoginResponseDto {
  token!: string;
  user!: UserResponse;
}

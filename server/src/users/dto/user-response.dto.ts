export class UserResponseDto {
  id!: number;
  email!: string;
  name?: string | null;
  phone?: string | null;
  role!: string;
  profile_image?: string | null;
  is_online!: boolean;
}

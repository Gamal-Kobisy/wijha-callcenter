export class UserResponseDto {
  id!: number;
  email!: string;
  name?: string | null;
  phone?: string | null;
  role!: string;
}

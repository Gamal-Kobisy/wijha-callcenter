export class UserResponseDto {
  id!: number;
  email!: string;
  name?: string | null;
  phone_number?: string | null;
  role!: string;
}

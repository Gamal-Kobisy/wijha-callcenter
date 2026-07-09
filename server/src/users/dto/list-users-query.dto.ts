import { IsOptional, IsEnum } from 'class-validator';

export class ListUsersQueryDto {
  @IsOptional()
  @IsEnum(['admin', 'user'] as const)
  role?: 'admin' | 'user';
}

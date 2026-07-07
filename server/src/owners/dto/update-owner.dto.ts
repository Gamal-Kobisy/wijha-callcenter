import { IsOptional, IsString } from 'class-validator';

export class UpdateOwnerDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  next_dial_at?: string | null;
}

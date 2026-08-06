import { IsOptional, IsString } from 'class-validator';

export class UpdateOwnerDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  next_dial_at?: string | null;
}

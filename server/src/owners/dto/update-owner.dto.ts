import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateOwnerDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsInt()
  agent_id?: number;

  @IsOptional()
  @IsString()
  next_dial_at?: string | null;
}

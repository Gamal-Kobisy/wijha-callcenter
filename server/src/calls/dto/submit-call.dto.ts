import { IsNumber, IsString, IsOptional, IsDateString } from 'class-validator';

export class SubmitCallDto {
  @IsNumber()
  owner_id!: number;

  @IsString()
  status!: string;

  @IsDateString()
  time!: string;

  @IsNumber()
  project_id!: number;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  agent_notes?: string;

  @IsOptional()
  @IsDateString()
  next_dial_at?: string;
}

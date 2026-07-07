import { IsNumber, IsString, IsOptional, IsDateString } from 'class-validator';

export class SubmitCallDto {
  @IsNumber()
  owner_id!: number;

  @IsString()
  status!: string;

  @IsDateString()
  time!: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  agent_notes?: string;
}

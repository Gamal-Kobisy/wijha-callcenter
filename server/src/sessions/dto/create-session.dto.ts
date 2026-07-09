import { IsDateString, IsOptional, IsNumber } from 'class-validator';

export class CreateSessionDto {
  @IsDateString()
  start_time!: string;

  @IsOptional()
  @IsNumber()
  duration?: number;
}

import { IsDateString, IsNumberString, IsOptional } from 'class-validator';

export class GetNextClientQueryDto {
  @IsNumberString()
  project_id!: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}

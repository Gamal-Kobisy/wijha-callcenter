import { IsDateString, IsNumberString, IsOptional } from 'class-validator';

export class GetNextClientQueryDto {
  @IsOptional()
  @IsNumberString()
  project_id?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}

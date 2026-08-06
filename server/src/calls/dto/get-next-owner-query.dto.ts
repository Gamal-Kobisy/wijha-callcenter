import { IsDateString, IsNumberString, IsOptional, IsBooleanString } from 'class-validator';

export class GetNextClientQueryDto {
  @IsNumberString()
  project_id!: string;

  @IsOptional()
  @IsBooleanString()
  assigned_only?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}

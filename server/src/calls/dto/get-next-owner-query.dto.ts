import { IsDate, IsDateString, IsNumberString, IsOptional } from 'class-validator';

export class GetNextOwnerQueryDto {
  @IsOptional()
  @IsNumberString()
  project_id?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}

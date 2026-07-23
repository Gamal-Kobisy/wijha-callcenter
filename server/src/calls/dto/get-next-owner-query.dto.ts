import { IsDateString, IsNumberString, IsOptional } from 'class-validator';

export class GetNextOwnerQueryDto {
  @IsNumberString()
  project_id!: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}

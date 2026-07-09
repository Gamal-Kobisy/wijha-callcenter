import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class ListOwnersQueryDto {
  @IsNumberString()
  @IsOptional()
  project_id?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}

import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class ListCallsQueryDto {
  @IsOptional()
  @IsNumberString()
  owner_id?: string;

  @IsOptional()
  @IsNumberString()
  agent_id?: string;

  @IsOptional()
  @IsNumberString()
  project_id?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}

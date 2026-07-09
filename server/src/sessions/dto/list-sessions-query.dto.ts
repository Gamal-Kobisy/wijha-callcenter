import { IsOptional, IsString } from 'class-validator';

export class ListSessionsQueryDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}

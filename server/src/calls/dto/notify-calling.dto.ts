import { IsOptional, IsString, IsNumber } from 'class-validator';

export class NotifyCallingDto {
  @IsNumber()
  owner_id!: number;

  @IsNumber()
  project_id!: number;

  @IsOptional()
  @IsString()
  owner_number?: string;
}

export class SessionResponseDto {
  id!: number;
  agent_id!: number;
  start_time!: string;
  duration?: number | null;
  is_active!: boolean;
}

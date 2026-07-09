export class CallResponseDto {
  id!: number;
  owner_id!: number;
  agent_id!: number;
  status!: string;
  time!: string;
  duration?: number | null;
  agent_notes?: string | null;
}

export class OwnerNumberResponse {
  number!: string;
}

export class OwnerInfoResponse {
  key!: string;
  value!: string;
}

export class OwnerResponseDto {
  id!: number;
  name?: string;
  status?: string;
  attempt_count?: number;
  last_dialed_at?: string | null;
  next_dial_at?: string | null;
  numbers?: OwnerNumberResponse[];
  info?: OwnerInfoResponse[];
}

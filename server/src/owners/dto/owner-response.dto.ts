export class OwnerPhoneResponse {
  phone!: string;
}

export class OwnerInfoResponse {
  key!: string;
  value!: string;
}

export class OwnerResponseDto {
  id!: number;
  name?: string;
  type?: string;
  next_dial_at?: string | null;
  phones?: OwnerPhoneResponse[];
  info?: OwnerInfoResponse[];
}

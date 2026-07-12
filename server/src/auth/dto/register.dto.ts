import { IsEnum, IsOptional, IsPhoneNumber, IsString, MinLength } from "class-validator";
import { UserRole } from "@prisma/client";

export class RegisterUserDTO {
    @IsString()
    @MinLength(1)
    email!: string;

    @IsString()
    @MinLength(1)
    password!: string;

    @IsString()
    @IsOptional()
    name?: string | null;

    @IsPhoneNumber()
    @IsOptional()
    phone?: string | null;

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;
}
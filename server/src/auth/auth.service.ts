import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginResponseDto } from './dto/login-response.dto';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { RegisterUserDTO } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<LoginResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { jwtToken: token }, // Store JWT token after successful login
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone_number: user.phoneNumber,
        role: user.role,
      },
    };
  }

  async register(dto: RegisterUserDTO): Promise<number> {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      throw new UnauthorizedException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name ?? null,
        phoneNumber: dto.phone_number,
        role: dto.role ?? 'user', // Set a default role if not provided
      },
    });

    // const payload = { id: user.id, email: user.email, role: user.role };
    // const token = this.jwtService.sign(payload);
    // await this.prisma.user.update({
    //   where: { id: user.id },
    //   data: { jwtToken: token }, // Store JWT token after successful registration
    // });

    // return {
    //   token,
    //   user: {
    //     id: user.id,
    //     email: user.email,
    //     name: user.name,
    //     phone_number: user.phoneNumber,
    //     role: user.role,
    //   },
    // };
    return user.id;
  }

  async validateUser(userId: number): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    return { id: user.id, email: user.email, role: user.role };
  }

  async logout(user: AuthenticatedUser): Promise<{message:string}> {
    let updated = await this.prisma.user.update({where: {id: user.id}, data: {jwtToken: null}});
    if(!updated.jwtToken){
      return { message: "Logged out successfully" };
    } else {
      return { message: "Something went wrong" };
    }
    
  }
}

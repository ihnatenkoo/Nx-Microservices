import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@nx-microservices/interfaces';
import { UserRepository } from '../user/repositories/user.repository';
import { UserEntity } from '../user/entities/user.entity';
import { WRONG_CREDENTIAL } from '../constants';
import { AccountRegister } from '@nx-microservices/contracts';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService
  ) {}

  async register({ email, password, displayName }: AccountRegister.Request) {
    const user = await this.userRepository.findUser(email);

    if (user) {
      throw new HttpException(
        'User already registered',
        HttpStatus.BAD_REQUEST
      );
    }

    const newUserEntity = await new UserEntity({
      email,
      displayName,
      role: UserRole.Student,
      passwordHash: '',
    }).setPassword(password);

    const newUser = await this.userRepository.createUser(newUserEntity);

    return { email: newUser.email };
  }

  async validateUser(email: string, password: string) {
    const user = await this.userRepository.findUser(email);

    if (!user) {
      throw new HttpException(WRONG_CREDENTIAL, HttpStatus.FORBIDDEN);
    }

    const userEntity = new UserEntity(user);
    const isPasswordCorrect = await userEntity.validatePassword(password);

    if (!isPasswordCorrect) {
      throw new HttpException(WRONG_CREDENTIAL, HttpStatus.FORBIDDEN);
    }

    return { id: user._id };
  }

  async login(id: string) {
    return {
      access_token: await this.jwtService.signAsync({ id }),
    };
  }
}

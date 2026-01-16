import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';
import { JwtService } from '@nestjs/jwt';
import { User } from './user.entity';
import { TokenResponse, JwtPayload } from '../common/types/auth.types';

const scrypt = promisify(_scrypt);

// constants for password hashing
const SALT_LENGTH = 16;
const HASH_LENGTH = 32;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // register a new user
  async signup(
    email: string,
    username: string,
    password: string,
    nickName: string,
    avatarFile?: { buffer: Buffer; originalname: string; mimetype: string },
  ): Promise<TokenResponse> {
    // hash the password
    const hashedPassword = await this.hashPassword(password);

    // create user (usersService handles duplicate checks and avatar upload)
    // you might wanna to not store the username with lower case
    // you can change that but u will need to make sure to handle the login
    // in case of the identifier was username to not make it lowercase
    const user = await this.usersService.create(
      email.toLowerCase(),
      username.toLowerCase(),
      nickName,
      hashedPassword,
      avatarFile,
    );

    // return JWT token
    return this.generateToken(user);
  }

  // validate user, this method is used by local strategy (passport)
  async validateUser(
    loginIdentifier: string,
    password: string,
  ): Promise<User | null> {
    // find user email or password
    const user = await this.usersService.findByLoginIdentifier(loginIdentifier);
    if (!user) {
      return null;
    }

    // now verify password
    const isPasswordValid = await this.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  // generate the jwt
  generateToken(user: User): TokenResponse {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '24h'),
      tokenType: 'Bearer',
    };
  }

  //change password for currentUser
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new BadRequestException("User wasn't found!");
    }
    const isPasswordValid = await this.verifyPassword(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Wrong password!');
    }
    const newHashedPassword = await this.hashPassword(newPassword);
    user.password = newHashedPassword;
    return this.usersService.save(user);
  }

  // HELPERTS TO HASH PASSWORD AND VERIFY IT

  // hash password with salt
  // you might consider using Argon2id it's recommended those days, but both works fine.
  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH).toString('hex');
    const hash = (await scrypt(password, salt, HASH_LENGTH)) as Buffer;
    return `${salt}.${hash.toString('hex')}`;
  }

  // verify candidate password Vs the stored one with salts
  private async verifyPassword(
    candidatePassword: string,
    storedPassword: string,
  ): Promise<boolean> {
    const [salt, storedHash] = storedPassword.split('.');
    const candidateHash = (await scrypt(
      candidatePassword,
      salt,
      HASH_LENGTH,
    )) as Buffer;
    return storedHash === candidateHash.toString('hex');
  }
}

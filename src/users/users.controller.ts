import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { CreateUserDto } from './dto/create-user.dto';
import { SignupSwaggerDto } from './swagger-schema/signup-swagger.dto';
import { UsersService } from './users.service';
import { UpdateUserDTO } from './dto/update-user.dto';
import { Serialize } from '../interceptors/serialize.interceptor';
import { UserDTO } from './dto/user.dto';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import * as common from '../common';
import type { AuthenticatedUser } from '../common/types/auth.types';
import { UpdatePasswordDto } from './dto/change-password.dto';
import { UpdateMeSwaggerDto } from './swagger-schema/updateme-swagger.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  // create new user (signup)
  @common.Public()
  @Post('/signup')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: SignupSwaggerDto })
  @common.ImageUpload('avatar')
  async signup(
    @Body() body: CreateUserDto,
    @common.UploadedImage({ required: false, maxSize: common.FileSizes.MB(5) })
    file?: Express.Multer.File,
  ) {
    const token = await this.authService.signup(
      body.email,
      body.username,
      body.password,
      body.nickName,
      file
        ? {
            buffer: file.buffer,
            originalname: file.originalname,
            mimetype: file.mimetype,
          }
        : undefined,
    );
    return {
      success: true,
      message: 'User created successfully',
      data: token,
    };
  }

  // login with username/email and password
  @common.Public()
  @UseGuards(common.LocalAuthGuard)
  @Post('/signin')
  async signin(@Body() _body: LoginUserDto, @Request() req: { user: any }) {
    // req.user is populated by LocalStrategy.validate()
    const token = this.authService.generateToken(req.user);
    return {
      success: true,
      message: 'Login successful',
      data: token,
    };
  }

  // get the current user from the token
  @Get('/me')
  @Serialize(UserDTO)
  async getCurrentUser(@common.CurrentUser() user: AuthenticatedUser) {
    return await this.usersService.findOne(user.userId);
  }

  // update current user
  @Patch('/me')
  @ApiConsumes('multipart/form-data')
  @common.ImageUpload('avatar')
  @ApiBody({ type: UpdateMeSwaggerDto })
  async updateCurrentUser(
    @common.CurrentUser('userId') userId: string,
    @Body() body: UpdateUserDTO,
    @common.UploadedImage({ required: false, maxSize: common.FileSizes.MB(5) })
    file?: Express.Multer.File,
  ) {
    await this.usersService.update(
      userId,
      body,
      file
        ? {
            buffer: file.buffer,
            originalname: file.originalname,
            mimetype: file.mimetype,
          }
        : undefined,
    );
    return {
      success: true,
      message: 'Profile updated successfully',
    };
  }

  @Patch('/change-password')
  async changePassword(
    @common.CurrentUser('userId') userId: string,
    @Body() body: UpdatePasswordDto,
  ) {
    await this.authService.changePassword(
      userId,
      body.currentPassword,
      body.newPassword,
    );
    return {
      success: true,
      message: 'User password was changed!',
    };
  }

  @Post('/forget-password')
  @common.Public()
  async forgetPassword(@Body() body: ForgetPasswordDto) {
    return await this.authService.forgetPassword(body.email);
  }

  // delete the current user
  @Delete('/me')
  async deleteCurrentUser(@common.CurrentUser('userId') userId: string) {
    await this.usersService.remove(userId);
    return {
      success: true,
      message: 'Account deleted successfully',
    };
  }

  // get user by id
  @Serialize(UserDTO)
  @Get('/users/:id')
  async getUserById(@Param('id') id: string) {
    return await this.usersService.findOne(id);
  }

  // get all users (paginated)
  @Serialize(common.PaginatedResponseDTO(UserDTO))
  @Get('users')
  async getUsers(@Query() query: common.PaginationQueryDto) {
    return await this.usersService.findAll(query);
  }

  // init the google auth flow
  @common.Public()
  @Get('/auth/google')
  @UseGuards(common.GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  googleAuth() {
    // this only redirect to google since we are using the Guard, this method body won't be
    // ecxecuted anyway
  }

  // google OAuth callback - handles the redirect from Google
  @common.Public()
  @Get('/auth/google/callback')
  @UseGuards(common.GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  googleAuthCallback(@Request() req: { user: any }, @Res() res: Response) {
    // req.user is populated by GoogleStrategy.validate()
    const token = this.authService.generateToken(req.user);

    // you have 2 options depending on your use cases:
    // option 1: redirect to frontend with token in query params
    // good for web apps - frontend can extract token and store it
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(
      `${frontendUrl}/auth/callback?token=${token.accessToken}&expiresIn=${token.expiresIn}`,
    );

    // option 2: return JSON directly (uncomment if you prefer this)
    // return { success: true, message: 'Google login successful', data: token };
  }
}

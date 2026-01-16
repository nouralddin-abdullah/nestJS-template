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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
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
  async updateCurrentUser(
    @common.CurrentUser('userId') userId: string,
    @Body() body: UpdateUserDTO,
  ) {
    await this.usersService.update(userId, body);
    return {
      success: true,
      message: 'Profile updated successfully',
    };
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
}

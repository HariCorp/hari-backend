import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, FilterUserDto } from '@app/common';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Get()
  async findAllUsers(@Query() filterDto: FilterUserDto) {
    return this.userService.findAllUsers(filterDto);
  }

  @Get(':id')
  async findUserById(@Param('id') id: string) {
    return this.userService.findUserById(id);
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }

  @Post('authenticate')
  async authenticate(@Body() credentials: { username: string; password: string }) {
    return this.userService.authenticate(credentials.username, credentials.password);
  }
}
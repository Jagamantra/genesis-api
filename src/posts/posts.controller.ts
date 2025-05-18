import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Post as PostEntity } from './schemas/post.schema';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The post has been successfully created.',
    type: PostEntity,
  })
  create(@Body() createPostDto: CreatePostDto): Promise<PostEntity> {
    return this.postsService.create(createPostDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all posts' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all posts.',
    type: [PostEntity],
  })
  findAll(): Promise<PostEntity[]> {
    return this.postsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a post by id' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the post.',
    type: PostEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post not found.',
  })
  findOne(@Param('id') id: string): Promise<PostEntity> {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The post has been successfully updated.',
    type: PostEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post not found.',
  })
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostEntity> {
    return this.postsService.update(id, updatePostDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The post has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post not found.',
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.postsService.remove(id);
  }
}

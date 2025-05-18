import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsArray } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    example: 'My First Post',
    description: 'The title of the post',
    required: true,
  })
  @IsString({ message: 'Title must be a string' })
  readonly title!: string;

  @ApiProperty({
    example: 'This is the content of my first post',
    description: 'The content of the post',
    required: true,
  })
  @IsString({ message: 'Content must be a string' })
  readonly content!: string;

  @ApiProperty({
    example: true,
    description: 'Whether the post is published',
    required: false,
    default: true,
  })
  @IsBoolean({ message: 'isPublished must be a boolean' })
  @IsOptional()
  readonly isPublished?: boolean = true;

  @ApiProperty({
    example: ['nestjs', 'mongodb'],
    description: 'Tags for the post',
    required: false,
    default: [],
    type: [String],
  })
  @IsArray({ message: 'Tags must be an array' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  @IsOptional()
  readonly tags?: string[] = [];
}

export class UpdatePostDto {
  @ApiProperty({
    example: 'Updated Post Title',
    description: 'The new title of the post',
    required: false,
  })
  @IsString({ message: 'Title must be a string' })
  @IsOptional()
  readonly title?: string;

  @ApiProperty({
    example: 'Updated content',
    description: 'The new content of the post',
    required: false,
  })
  @IsString({ message: 'Content must be a string' })
  @IsOptional()
  readonly content?: string;

  @ApiProperty({
    example: false,
    description: 'The new published status of the post',
    required: false,
  })
  @IsBoolean({ message: 'isPublished must be a boolean' })
  @IsOptional()
  readonly isPublished?: boolean;

  @ApiProperty({
    example: ['updated', 'tags'],
    description: 'The new tags for the post',
    required: false,
    type: [String],
  })
  @IsArray({ message: 'Tags must be an array' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  @IsOptional()
  readonly tags?: string[];
}

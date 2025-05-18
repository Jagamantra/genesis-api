import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
  ) {}

  async create(createPostDto: CreatePostDto): Promise<Post> {
    const createdPost = new this.postModel(createPostDto);
    return createdPost.save();
  }

  async findAll(): Promise<Post[]> {
    return this.postModel.find().exec();
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.postModel.findById(id).exec();
    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }
    return post;
  }

  async update(id: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const updatedPost = await this.postModel
      .findByIdAndUpdate(id, updatePostDto, { new: true })
      .exec();
    if (!updatedPost) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }
    return updatedPost;
  }

  async remove(id: string): Promise<void> {
    const result = await this.postModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }
  }
}

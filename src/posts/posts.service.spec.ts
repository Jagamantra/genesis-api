import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PostsService } from './posts.service';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/post.dto';
import { NotFoundException } from '@nestjs/common';

describe('PostsService', () => {
  let service: PostsService;
  let model: Model<PostDocument>;

  const mockPost = {
    _id: 'some-id',
    title: 'Test Post',
    content: 'Test Content',
    isPublished: true,
    tags: ['test'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getModelToken(Post.name),
          useValue: (() => {
            class MockPostModel {
              constructor(dto: any) {
                Object.assign(this, dto);
              }
              save = jest.fn().mockResolvedValue(mockPost);
              static find = jest.fn().mockReturnThis();
              static findById = jest.fn().mockReturnThis();
              static findByIdAndUpdate = jest.fn().mockReturnThis();
              static findByIdAndDelete = jest.fn().mockReturnThis();
              static exec = jest.fn().mockResolvedValue([mockPost]);
            }
            return MockPostModel;
          })(),
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    model = module.get<Model<PostDocument>>(getModelToken(Post.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new post', async () => {
      const createPostDto: CreatePostDto = {
        title: 'Test Post',
        content: 'Test Content',
      };

      // Create a mock instance with save method
      const result = await service.create(createPostDto);
      expect(result).toEqual(mockPost);
    });
  });

  describe('findAll', () => {
    it('should return an array of posts', async () => {
      jest.spyOn(model, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce([mockPost]),
      } as unknown as ReturnType<typeof model.find>);

      const posts = await service.findAll();
      expect(posts).toEqual([mockPost]);
    });
  });

  describe('findOne', () => {
    it('should return a single post', async () => {
      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(mockPost),
      } as unknown as ReturnType<typeof model.findById>);

      const post = await service.findOne('some-id');
      expect(post).toEqual(mockPost);
    });

    it('should throw an error if post is not found', async () => {
      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(null),
      } as unknown as ReturnType<typeof model.findById>);

      await expect(service.findOne('wrong-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a post', async () => {
      const updatePostDto = {
        title: 'Updated Title',
      };

      jest.spyOn(model, 'findByIdAndUpdate').mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValueOnce({ ...mockPost, ...updatePostDto }),
      } as unknown as ReturnType<typeof model.findByIdAndUpdate>);

      const result = await service.update('some-id', updatePostDto);
      expect(result.title).toBe(updatePostDto.title);
    });

    it('should throw an error if post to update is not found', async () => {
      jest.spyOn(model, 'findByIdAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(null),
      } as unknown as ReturnType<typeof model.findByIdAndUpdate>);

      await expect(service.update('wrong-id', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a post', async () => {
      jest.spyOn(model, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(mockPost),
      } as unknown as ReturnType<typeof model.findByIdAndDelete>);

      const removeSpy = jest.spyOn(model, 'findByIdAndDelete');
      await service.remove('some-id');
      expect(removeSpy).toHaveBeenCalledWith('some-id');
    });

    it('should throw an error if post to remove is not found', async () => {
      jest.spyOn(model, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(null),
      } as unknown as ReturnType<typeof model.findByIdAndDelete>);

      await expect(service.remove('wrong-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { NotFoundException } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { MockAuthGuard } from '../common/testing/mock-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

describe('PostsController', () => {
  let controller: PostsController;
  let service: PostsService;

  const mockPost = {
    id: 'some-id',
    title: 'Test Post',
    content: 'Test Content',
    isPublished: true,
    tags: ['test'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPostsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: mockPostsService,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useClass(MockAuthGuard)
      .compile();

    controller = module.get<PostsController>(PostsController);
    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createPostDto: CreatePostDto = {
      title: 'Test Post',
      content: 'Test Content',
    };

    it('should create a new post', async () => {
      const createSpy = jest
        .spyOn(service, 'create')
        .mockImplementation(() => Promise.resolve(mockPost));

      const result = await controller.create(createPostDto);
      expect(result).toBe(mockPost);
      expect(createSpy).toHaveBeenCalledWith(createPostDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of posts', async () => {
      const findAllSpy = jest
        .spyOn(service, 'findAll')
        .mockImplementation(() => Promise.resolve([mockPost]));

      const result = await controller.findAll();
      expect(result).toEqual([mockPost]);
      expect(findAllSpy).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single post', async () => {
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockImplementation(() => Promise.resolve(mockPost));

      const result = await controller.findOne('some-id');
      expect(result).toBe(mockPost);
      expect(findOneSpy).toHaveBeenCalledWith('some-id');
    });

    it('should throw NotFoundException when post is not found', async () => {
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockImplementation(() => Promise.reject(new NotFoundException()));

      await expect(controller.findOne('wrong-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(findOneSpy).toHaveBeenCalledWith('wrong-id');
    });
  });

  describe('update', () => {
    const updatePostDto: UpdatePostDto = {
      title: 'Updated Title',
    };

    it('should update a post', async () => {
      const updateSpy = jest
        .spyOn(service, 'update')
        .mockImplementation(() =>
          Promise.resolve({ ...mockPost, ...updatePostDto }),
        );

      const result = await controller.update('some-id', updatePostDto);
      expect(result.title).toBe(updatePostDto.title);
      expect(updateSpy).toHaveBeenCalledWith('some-id', updatePostDto);
    });
  });

  describe('remove', () => {
    it('should remove a post', async () => {
      const removeSpy = jest
        .spyOn(service, 'remove')
        .mockImplementation(() => Promise.resolve(undefined));

      await controller.remove('some-id');
      expect(removeSpy).toHaveBeenCalledWith('some-id');
    });
  });
});

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type PostDocument = Post & Document;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (
      _doc: any,
      ret: { _id?: string; __v?: number; id?: string },
    ) => {
      ret.id = ret._id?.toString() || '';
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Post {
  @ApiProperty({ example: 'My First Post' })
  @Prop({ required: true })
  title: string;

  @ApiProperty({ example: 'This is the content of my first post' })
  @Prop({ required: true })
  content: string;

  @ApiProperty({ example: true })
  @Prop({ default: true })
  isPublished: boolean;

  @ApiProperty({ example: ['nestjs', 'mongodb'] })
  @Prop({ type: [String], default: [] })
  tags: string[];

  @ApiProperty()
  createdAt?: Date;

  @ApiProperty()
  updatedAt?: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);

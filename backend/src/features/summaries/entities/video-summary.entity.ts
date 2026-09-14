import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Prompt } from '../../../features/prompts/entities/prompt.entity';

export enum SummaryStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

@Entity('video_summaries')
export class VideoSummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 500 })
  youtubeUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  videoTitle: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  channelName: string | null;

  @Column({ type: 'text', nullable: true })
  transcript: string | null;

  @Column({ type: 'text', nullable: true })
  markdownContent: string | null;

  @Index()
  @Column({
    type: 'enum',
    enum: SummaryStatus,
    default: SummaryStatus.PENDING,
  })
  status: SummaryStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  promptId: string | null;

  @ManyToOne(() => Prompt, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: false,
  })
  @JoinColumn({ name: 'promptId' })
  prompt: Prompt | null;

  @Column({ type: 'text', nullable: true })
  promptSnapshot: string | null;

  @Index()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

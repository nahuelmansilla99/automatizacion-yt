import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { VideoSummary } from '../../features/summaries/entities/video-summary.entity';
import { Prompt } from '../../features/prompts/entities/prompt.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5434', 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [VideoSummary, Prompt],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { VideoSummary } from '../../features/summaries/entities/video-summary.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5434', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres123',
  database: process.env.DATABASE_NAME || 'yt_summaries_db',
  entities: [VideoSummary],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});

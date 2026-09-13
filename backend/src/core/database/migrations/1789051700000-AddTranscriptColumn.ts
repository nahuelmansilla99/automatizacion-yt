import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTranscriptColumn1789051700000 implements MigrationInterface {
  name = 'AddTranscriptColumn1789051700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "video_summaries" ADD COLUMN IF NOT EXISTS "transcript" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "video_summaries" DROP COLUMN IF EXISTS "transcript"`,
    );
  }
}

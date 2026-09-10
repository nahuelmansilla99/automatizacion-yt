import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1789051606168 implements MigrationInterface {
  name = 'InitialSchema1789051606168';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TYPE "public"."video_summaries_status_enum" AS ENUM('PENDING', 'SUCCESS', 'ERROR')`,
    );
    await queryRunner.query(
      `CREATE TABLE "video_summaries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "youtubeUrl" character varying(500) NOT NULL, "videoTitle" character varying(255), "channelName" character varying(255), "markdownContent" text, "status" "public"."video_summaries_status_enum" NOT NULL DEFAULT 'PENDING', "errorMessage" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0042db8b0fe660c34c50be39ed0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f370c4dc72a95773e896ed2d35" ON "video_summaries" ("youtubeUrl") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3d02415f725a1ae0b908080ff1" ON "video_summaries" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_203b81ef0cbeb77b60c1511de6" ON "video_summaries" ("createdAt") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_203b81ef0cbeb77b60c1511de6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3d02415f725a1ae0b908080ff1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f370c4dc72a95773e896ed2d35"`,
    );
    await queryRunner.query(`DROP TABLE "video_summaries"`);
    await queryRunner.query(`DROP TYPE "public"."video_summaries_status_enum"`);
  }
}

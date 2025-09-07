import { MigrationInterface, QueryRunner } from 'typeorm';

export class Namechange1752014983931 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "USERS" RENAME TO "COMPRADORES"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "COMPRADORES" RENAME TO "USERS"`);
  }
}

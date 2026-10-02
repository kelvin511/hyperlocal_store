import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261002062655 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "vendor" add column if not exists "status" text check ("status" in ('pending', 'approved', 'rejected', 'disabled')) not null default 'pending';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "vendor" drop column if exists "status";`);
  }

}

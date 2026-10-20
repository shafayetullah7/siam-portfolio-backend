CREATE TABLE "admin_upload_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"media_id" uuid NOT NULL,
	"admin_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cloudinary_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"media_id" uuid NOT NULL UNIQUE,
	"public_key" varchar(300) NOT NULL UNIQUE
);
--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "file_name" varchar(500) NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "size" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "alt" varchar(500);--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "caption" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "license" text;--> statement-breakpoint
ALTER TABLE "media" DROP COLUMN "public_key";--> statement-breakpoint
ALTER TABLE "media" DROP COLUMN "alt_text";--> statement-breakpoint
ALTER TABLE "admin_upload_media" ADD CONSTRAINT "admin_upload_media_media_id_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "admin_upload_media" ADD CONSTRAINT "admin_upload_media_admin_id_admins_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cloudinary_media" ADD CONSTRAINT "cloudinary_media_media_id_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE;
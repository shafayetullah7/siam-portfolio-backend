ALTER TABLE "site_settings" ADD COLUMN "collaborations_page_intro" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "collaborations_page_enabled" boolean DEFAULT false NOT NULL;
ALTER TABLE "homepage" ADD COLUMN "hero_descriptor" varchar(500);--> statement-breakpoint
ALTER TABLE "homepage" ADD COLUMN "hero_positioning" text;--> statement-breakpoint
ALTER TABLE "homepage" ADD COLUMN "status_badge" varchar(80);--> statement-breakpoint
ALTER TABLE "homepage" ADD COLUMN "primary_cta_label" varchar(120);--> statement-breakpoint
ALTER TABLE "homepage" ADD COLUMN "primary_cta_href" varchar(500);--> statement-breakpoint
ALTER TABLE "homepage" ADD COLUMN "secondary_cta_label" varchar(120);--> statement-breakpoint
ALTER TABLE "homepage" ADD COLUMN "secondary_cta_href" varchar(500);--> statement-breakpoint
ALTER TABLE "homepage" ADD COLUMN "hero_media_id" uuid;--> statement-breakpoint
ALTER TABLE "homepage" ADD COLUMN "sections" jsonb;--> statement-breakpoint
ALTER TABLE "homepage" ADD COLUMN "highlights" jsonb;--> statement-breakpoint
ALTER TABLE "homepage" ADD COLUMN "currently_working_on" jsonb;--> statement-breakpoint
ALTER TABLE "homepage" ADD COLUMN "collaboration_cta" jsonb;--> statement-breakpoint
ALTER TABLE "homepage" ADD COLUMN "profiles" jsonb;--> statement-breakpoint
ALTER TABLE "homepage" ADD COLUMN "seo_title" varchar(120);--> statement-breakpoint
ALTER TABLE "homepage" ADD COLUMN "seo_description" varchar(320);--> statement-breakpoint
ALTER TABLE "homepage" ADD COLUMN "publish_status" "publish_status" DEFAULT 'draft'::"publish_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "homepage" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "homepage" ADD COLUMN "scheduled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "homepage" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "display_name" varchar(200);--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "professional_title" varchar(300);--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "contact_email" varchar(320);--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "affiliation_role" varchar(300);--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "affiliation_organization" varchar(300);--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "affiliation_location" varchar(300);--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "portrait_media_id" uuid;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "scholarly_profiles" jsonb;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "research_statement" text;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "publish_status" "publish_status" DEFAULT 'draft'::"publish_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "scheduled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "homepage" ADD CONSTRAINT "homepage_hero_media_id_media_id_fkey" FOREIGN KEY ("hero_media_id") REFERENCES "media"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_portrait_media_id_media_id_fkey" FOREIGN KEY ("portrait_media_id") REFERENCES "media"("id") ON DELETE SET NULL;
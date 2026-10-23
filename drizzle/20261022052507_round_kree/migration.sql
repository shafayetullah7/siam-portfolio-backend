CREATE TYPE "publication_type" AS ENUM('journal', 'conference', 'preprint', 'workshop', 'thesis', 'other');--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN "abstract" text;--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN "publication_type" "publication_type" DEFAULT 'other'::"publication_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN "peer_reviewed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN "doi" varchar(200);--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN "publisher_url" varchar(2000);--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN "featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN "featured_on_home" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN "seo_title" varchar(500);--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN "seo_description" text;--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN "owner_contribution" text;--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN "correction_notice" text;--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN "hide_from_search" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "publications" ADD CONSTRAINT "publications_doi_key" UNIQUE("doi");
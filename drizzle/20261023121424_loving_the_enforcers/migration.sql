CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slug" varchar(200) NOT NULL UNIQUE,
	"title" varchar(500) NOT NULL,
	"subtitle" text,
	"summary" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"tags" text[],
	"series_id" uuid,
	"series_sort_order" integer,
	"cover_media_id" uuid,
	"byline" text,
	"reading_time_minutes" integer,
	"word_count" integer,
	"featured_on_hub" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"materially_updated_at" timestamp with time zone,
	"seo_title" varchar(500),
	"seo_description" text,
	"hide_from_search" boolean DEFAULT false NOT NULL,
	"publish_status" "publish_status" DEFAULT 'draft'::"publish_status" NOT NULL,
	"published_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "writing_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slug" varchar(200) NOT NULL UNIQUE,
	"title" varchar(500) NOT NULL,
	"summary" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "articles_publish_status_idx" ON "articles" ("publish_status");--> statement-breakpoint
CREATE INDEX "articles_published_at_idx" ON "articles" ("published_at");--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_series_id_writing_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "writing_series"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_cover_media_id_media_id_fkey" FOREIGN KEY ("cover_media_id") REFERENCES "media"("id") ON DELETE SET NULL;
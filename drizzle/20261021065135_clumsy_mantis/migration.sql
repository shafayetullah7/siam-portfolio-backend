CREATE TYPE "research_theme_status" AS ENUM('ongoing', 'completed');--> statement-breakpoint
CREATE TABLE "research_themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slug" varchar(200) NOT NULL UNIQUE,
	"title" varchar(300) NOT NULL,
	"summary" text NOT NULL,
	"theme_status" "research_theme_status" DEFAULT 'ongoing'::"research_theme_status" NOT NULL,
	"problem" text DEFAULT '' NOT NULL,
	"significance" text,
	"objectives" text,
	"approach" text,
	"findings" text,
	"limitations" text,
	"future_work" text,
	"tags" text[],
	"link_label" varchar(120),
	"cover_media_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"featured_on_home" boolean DEFAULT false NOT NULL,
	"publish_status" "publish_status" DEFAULT 'draft'::"publish_status" NOT NULL,
	"published_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"seo_title" varchar(120),
	"seo_description" varchar(320),
	"collaborators" jsonb,
	"acknowledgments" text,
	"funding" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "research_themes" ADD CONSTRAINT "research_themes_cover_media_id_media_id_fkey" FOREIGN KEY ("cover_media_id") REFERENCES "media"("id") ON DELETE SET NULL;
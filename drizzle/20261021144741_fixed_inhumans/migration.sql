CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slug" varchar(200) NOT NULL UNIQUE,
	"title" varchar(500) NOT NULL,
	"summary" text NOT NULL,
	"tags" text[],
	"publish_status" "publish_status" DEFAULT 'draft'::"publish_status" NOT NULL,
	"published_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_theme_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"theme_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "research_theme_projects_theme_project_unique" ON "research_theme_projects" ("theme_id","project_id");--> statement-breakpoint
ALTER TABLE "research_theme_projects" ADD CONSTRAINT "research_theme_projects_theme_id_research_themes_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "research_themes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "research_theme_projects" ADD CONSTRAINT "research_theme_projects_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;
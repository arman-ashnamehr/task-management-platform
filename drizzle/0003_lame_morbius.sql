CREATE TYPE "public"."project_role" AS ENUM('MANAGER', 'MEMBER');--> statement-breakpoint
CREATE TABLE "project_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "project_role" DEFAULT 'MEMBER' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	--Prevents duplicate entries for the same user in the same project.
	CONSTRAINT "project_member_project_user_unique" UNIQUE("project_id","user_id")
);
-->
--(project_id, workspace_id) exists in project proves the project actually lives in that workspace_id.
--(workspace_id, user_id) exists in workspace_member proves that user_id is actually a member of that same workspace_id.

--> statement-breakpoint
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_project_workspace_fk" FOREIGN KEY ("project_id","workspace_id") REFERENCES "public"."project"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_workspace_user_fk" FOREIGN KEY ("workspace_id","user_id") REFERENCES "public"."workspace_member"("workspace_id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_member_user_id_idx" ON "project_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "project_member_workspace_user_idx" ON "project_member" USING btree ("workspace_id","user_id");
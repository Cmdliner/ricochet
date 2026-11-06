ALTER TYPE "public"."activity_kind" ADD VALUE 'reaction' BEFORE 'invite';--> statement-breakpoint
ALTER TABLE "activity" ADD COLUMN "actor_id" uuid;--> statement-breakpoint
ALTER TABLE "activity" ADD COLUMN "conversation_id" uuid;--> statement-breakpoint
ALTER TABLE "activity" ADD COLUMN "emoji" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "activity_once" ON "activity" USING btree ("user_id","kind","message_id","actor_id","emoji");
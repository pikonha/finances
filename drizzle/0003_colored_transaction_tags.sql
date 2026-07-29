ALTER TABLE "transaction" DROP CONSTRAINT IF EXISTS "transaction_category_id_category_id_fk";--> statement-breakpoint
ALTER TABLE "recurrence_rule" DROP CONSTRAINT IF EXISTS "recurrence_rule_category_id_category_id_fk";--> statement-breakpoint
ALTER TABLE "category" RENAME TO "tag";--> statement-breakpoint
ALTER TABLE "tag" DROP CONSTRAINT IF EXISTS "category_user_id_user_id_fk";--> statement-breakpoint
ALTER TABLE "tag" ADD COLUMN "color" text DEFAULT '#2563eb' NOT NULL;--> statement-breakpoint
CREATE TABLE "transaction_tag" (
	"transaction_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "pk_transaction_tag" PRIMARY KEY("transaction_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "recurrence_rule_tag" (
	"recurrence_rule_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "pk_recurrence_rule_tag" PRIMARY KEY("recurrence_rule_id","tag_id")
);
--> statement-breakpoint
INSERT INTO "transaction_tag" ("transaction_id", "tag_id")
SELECT "id", "category_id" FROM "transaction" WHERE "category_id" IS NOT NULL
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "recurrence_rule_tag" ("recurrence_rule_id", "tag_id")
SELECT "id", "category_id" FROM "recurrence_rule" WHERE "category_id" IS NOT NULL
ON CONFLICT DO NOTHING;--> statement-breakpoint
ALTER TABLE "transaction_tag" ADD CONSTRAINT "transaction_tag_transaction_id_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_tag" ADD CONSTRAINT "transaction_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurrence_rule_tag" ADD CONSTRAINT "recurrence_rule_tag_recurrence_rule_id_recurrence_rule_id_fk" FOREIGN KEY ("recurrence_rule_id") REFERENCES "public"."recurrence_rule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurrence_rule_tag" ADD CONSTRAINT "recurrence_rule_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "category_id";--> statement-breakpoint
ALTER TABLE "recurrence_rule" DROP COLUMN "category_id";

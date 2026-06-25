import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const certificates = pgTable("psy_certificates", {
  id:          serial("id").primaryKey(),
  certCode:    text("cert_code").unique().notNull(),
  studentName: text("student_name").notNull(),
  courseName:  text("course_name").notNull(),
  level:       text("level").notNull(),
  score:       integer("score").notNull(),
  issuedAt:    timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertCertificateSchema = createInsertSchema(certificates).omit({ id: true, issuedAt: true });
export type Certificate    = typeof certificates.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;

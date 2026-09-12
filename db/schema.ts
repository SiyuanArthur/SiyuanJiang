import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const workbench = sqliteTable("workbench", {
  id: text("id").primaryKey().notNull(),
  payload: text("payload").notNull(),
  revision: integer("revision").notNull().default(1),
  updated: text("updated").notNull(),
});
export const items = sqliteTable("items", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  date: text("date").notNull(),
  done: integer("done").notNull().default(0),
  count: integer("count").notNull().default(0),
  name: text("name").notNull().default(""),
  size: integer("size").notNull().default(0),
  created: text("created").notNull(),
});

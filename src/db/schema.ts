import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const itineraries = sqliteTable("itineraries", {
	id: text().primaryKey(),
	editId: text("edit_id").notNull(),
	title: text(),
	description: text(),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
});

export const tickets = sqliteTable("tickets", {
	id: text().primaryKey(),
	itineraryId: text("itinerary_id")
		.notNull()
		.references(() => itineraries.id, { onDelete: "cascade" }),
	name: text().notNull(),
	price: integer().notNull(),
});

export const movements = sqliteTable("movements", {
	id: integer({ mode: "number" }).primaryKey({
		autoIncrement: true,
	}),
	itineraryId: text("itinerary_id")
		.notNull()
		.references(() => itineraries.id, { onDelete: "cascade" }),
	day: integer().notNull(), // Day 1, Day 2
	displayOrder: integer("display_order").notNull(),
	departurePoint: text("departure_point").notNull(),
	departureTime: text("departure_time").notNull(), // HH:MM
	travelMethod: text("travel_method").notNull(), // Train, Bus, Walk, etc
	lineName: text("line_name"),
	arrivalTime: text("arrival_time").notNull(), // HH:MM
	arrivalPoint: text("arrival_point").notNull(),
	fare: integer(),
	isContinuousFare: integer("is_continuous_fare", { mode: "boolean" })
		.notNull()
		.default(false),
	ticketId: text("ticket_id").references(() => tickets.id, {
		onDelete: "set null",
	}),
	notes: text(),
});

export type Ticket = typeof tickets.$inferSelect;

export type Movement = typeof movements.$inferSelect;

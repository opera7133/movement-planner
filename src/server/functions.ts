import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../db/index";
import { itineraries, movements, tickets } from "../db/schema";

export const getItinerary = createServerFn({ method: "GET" })
	.inputValidator((d: string) => d)
	.handler(async ({ data: id }) => {
		const itinerary = await db
			.select()
			.from(itineraries)
			.where(eq(itineraries.id, id))
			.get();

		if (!itinerary) {
			return null;
		}

		const m = await db
			.select()
			.from(movements)
			.where(eq(movements.itineraryId, id))
			.orderBy(movements.day, movements.displayOrder)
			.all();

		const t = await db
			.select()
			.from(tickets)
			.where(eq(tickets.itineraryId, id))
			.all();

		return { ...itinerary, movements: m, tickets: t };
	});

export const getItineraryByEditId = createServerFn({ method: "GET" })
	.inputValidator((d: string) => d)
	.handler(async ({ data: editId }) => {
		const itinerary = await db
			.select()
			.from(itineraries)
			.where(eq(itineraries.editId, editId))
			.get();

		if (!itinerary) {
			return null;
		}

		const m = await db
			.select()
			.from(movements)
			.where(eq(movements.itineraryId, itinerary.id))
			.orderBy(movements.day, movements.displayOrder)
			.all();

		const t = await db
			.select()
			.from(tickets)
			.where(eq(tickets.itineraryId, itinerary.id))
			.all();

		return { ...itinerary, movements: m, tickets: t };
	});

export type CreateItineraryInput = {
	title?: string;
	description?: string;
	token: string;
	movements: {
		day: number;
		displayOrder: number;
		departurePoint: string;
		departureTime: string;
		travelMethod: string;
		lineName?: string;
		arrivalTime: string;
		arrivalPoint: string;
		fare?: number;
		isContinuousFare: boolean;
		ticketId?: string | null;
		notes?: string;
	}[];
	tickets: {
		id: string; // nanoid
		name: string;
		price: number;
	}[];
};

export const createItinerary = createServerFn({ method: "POST" })
	.inputValidator((d: CreateItineraryInput) => d)
	.handler(async ({ data }) => {
		// 1. Validate Turnstile token
		const formData = new FormData();
		formData.append("secret", process.env.TURNSTILE_SECRET_KEY || "");
		formData.append("response", data.token);

		const result = await fetch(
			"https://challenges.cloudflare.com/turnstile/v0/siteverify",
			{
				body: formData,
				method: "POST",
			},
		);

		const outcome = await result.json();

		if (!outcome.success && process.env.TURNSTILE_SECRET_KEY) {
			throw new Error("Invalid CAPTCHA");
		}

		// 2. Insert into DB
		const id = nanoid(10);
		const editId = nanoid(21); // Longer ID for editing security

		await db.insert(itineraries)
			.values({
				id,
				editId,
				title: data.title || "Untitled Itinerary",
				description: data.description,
			})
			.run();

		if (data.tickets && data.tickets.length > 0) {
			await db.insert(tickets)
				.values(
					data.tickets.map((t) => ({
						id: t.id,
						itineraryId: id,
						name: t.name,
						price: t.price,
					})),
				)
				.run();
		}

		if (data.movements.length > 0) {
			await db.insert(movements)
				.values(
					data.movements.map((m) => ({
						itineraryId: id,
						day: m.day,
						displayOrder: m.displayOrder,
						departurePoint: m.departurePoint,
						departureTime: m.departureTime,
						travelMethod: m.travelMethod,
						lineName: m.lineName,
						arrivalTime: m.arrivalTime,
						arrivalPoint: m.arrivalPoint,
						fare: m.fare,
						isContinuousFare: m.isContinuousFare,
						ticketId: m.ticketId,
						notes: m.notes,
					})),
				)
				.run();
		}

		return { id, editId };
	});

export type UpdateItineraryInput = {
	editId: string;
	title?: string;
	description?: string;
	movements: {
		day: number;
		displayOrder: number;
		departurePoint: string;
		departureTime: string;
		travelMethod: string;
		lineName?: string;
		arrivalTime: string;
		arrivalPoint: string;
		fare?: number;
		isContinuousFare: boolean;
		ticketId?: string | null;
		notes?: string;
	}[];
	tickets: {
		id: string;
		name: string;
		price: number;
	}[];
};

export const updateItinerary = createServerFn({ method: "POST" })
	.inputValidator((d: UpdateItineraryInput) => d)
	.handler(async ({ data }) => {
		// Find the itinerary by editId to get the public id
		const itinerary = await db
			.select()
			.from(itineraries)
			.where(eq(itineraries.editId, data.editId))
			.get();

		if (!itinerary) {
			throw new Error("Itinerary not found or invalid edit URL");
		}

		const id = itinerary.id;

		// Update title
		await db.update(itineraries)
			.set({
				title: data.title || "Untitled Itinerary",
				description: data.description,
			})
			.where(eq(itineraries.editId, data.editId))
			.run();

		// Handle tickets similarly: delete all existing, insert new
		await db.delete(tickets).where(eq(tickets.itineraryId, id)).run();

		if (data.tickets && data.tickets.length > 0) {
			await db.insert(tickets)
				.values(
					data.tickets.map((t) => ({
						id: t.id,
						itineraryId: id,
						name: t.name,
						price: t.price,
					})),
				)
				.run();
		}
		// Delete existing movements and replace them entirely to handle sorting/deletion cleanly
		await db.delete(movements).where(eq(movements.itineraryId, id)).run();

		if (data.movements.length > 0) {
			await db.insert(movements)
				.values(
					data.movements.map((m) => ({
						itineraryId: id,
						day: m.day,
						displayOrder: m.displayOrder,
						departurePoint: m.departurePoint,
						departureTime: m.departureTime,
						travelMethod: m.travelMethod,
						lineName: m.lineName,
						arrivalTime: m.arrivalTime,
						arrivalPoint: m.arrivalPoint,
						fare: m.fare,
						isContinuousFare: m.isContinuousFare,
						ticketId: m.ticketId,
						notes: m.notes,
					})),
				)
				.run();
		}

		return id;
	});

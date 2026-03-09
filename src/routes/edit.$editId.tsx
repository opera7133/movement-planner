import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { useState } from "react";
import type { Movement } from "@/db/schema";
import { defaultMovement, ItineraryForm } from "../components/ItineraryForm";
import { Button } from "../components/ui/button";
import { getItineraryByEditId, updateItinerary } from "../server/functions";

export const Route = createFileRoute("/edit/$editId")({
	component: EditItinerary,
	loader: async ({ params: { editId } }) => {
		const itinerary = await getItineraryByEditId({ data: editId });
		if (!itinerary) {
			throw new Error("Itinerary not found or invalid URL");
		}
		return { itinerary, editId };
	},
	head: ({ loaderData }) => ({
		meta: [
			{
				title: `編集:${loaderData?.itinerary.title} | Movement Planner`,
			},
			{
				name: "robots",
				content: "noindex,nofollow",
			},
		],
	}),
	errorComponent: () => {
		return (
			<div className="mx-auto md:container px-4 py-24 text-center">
				<h1 className="text-3xl font-bold mb-4">エラー</h1>
				<p className="text-muted-foreground">
					旅程が見つからないか、編集用URLが無効です。
				</p>
				<Button asChild className="mt-8">
					<Link to="/">トップページへ戻る</Link>
				</Button>
			</div>
		);
	},
});

function EditItinerary() {
	const { itinerary, editId } = Route.useLoaderData();
	const title = itinerary.title || "";
	const description = itinerary.description || "";
	const movements = itinerary.movements as Movement[];
	const tickets = (itinerary as any).tickets || []; // temporary type cast to bypass ts error

	const [successData, setSuccessData] = useState<{ id: string } | null>(null);

	// Pre-process itinerary movements into the nested days format expected by the form
	const groupedMovements = movements.reduce(
		(acc, m) => {
			const day = m.day;
			if (!acc[day]) acc[day] = [];
			acc[day].push({
				departurePoint: m.departurePoint,
				departureTime: m.departureTime,
				travelMethod: m.travelMethod,
				lineName: m.lineName || "",
				arrivalTime: m.arrivalTime,
				arrivalPoint: m.arrivalPoint,
				fare: m.fare !== null ? m.fare : undefined,
				isContinuousFare: m.isContinuousFare || false,
				ticketId: m.ticketId || undefined,
				notes: m.notes || "",
			});
			return acc;
		},
		{} as Record<number, any[]>,
	);

	const days = Object.keys(groupedMovements)
		.map(Number)
		.sort((a, b) => a - b)
		.map((day) => ({
			day,
			movements: groupedMovements[day],
		}));

	// ---- Success View ----
	if (successData) {
		return (
			<div className="mx-auto md:container md:max-w-4xl px-4 max-w-3xl py-12">
				<div className="text-center mb-10">
					<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-6">
						<CheckCircle2 className="w-10 h-10" />
					</div>
					<h1 className="text-3xl font-bold tracking-tight">
						旅程を更新しました！
					</h1>
					<p className="text-muted-foreground mt-2">
						変更内容はすぐに公開用URLに反映されます。
					</p>
				</div>

				<div className="space-y-6 flex flex-col items-center">
					<Button size="lg" asChild>
						<Link to="/i/$id" params={{ id: successData.id }}>
							公開ページを確認する <ExternalLink className="w-4 h-4 ml-2" />
						</Link>
					</Button>

					<Button variant="outline" onClick={() => setSuccessData(null)}>
						引き続き編集する
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto md:container md:max-w-4xl px-4 py-10">
			<div className="mb-8 space-y-2 flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">旅程を編集</h1>
					<p className="text-muted-foreground mt-2">
						旅程を編集・追加して再保存できます。
					</p>
				</div>
				<Button variant="outline" asChild>
					<Link to="/i/$id" params={{ id: itinerary.id }}>
						公開用ページを確認 <ExternalLink className="w-4 h-4 ml-2" />
					</Link>
				</Button>
			</div>

			<ItineraryForm
				defaultValues={{
					title: title,
					description: description,
					tickets: tickets as { id: string; name: string; price: number }[],
					days:
						days.length > 0
							? days
							: [
									{
										day: 1,
										movements: [{ ...defaultMovement }],
									},
								],
				}}
				onSubmit={async (value) => {
					const flatMovements = value.days.flatMap((d) =>
						d.movements.map((m, index) => ({
							day: d.day,
							displayOrder: index,
							...m,
							fare: typeof m.fare === "string" ? Number(m.fare) : m.fare,
							isContinuousFare: m.isContinuousFare || false,
							ticketId: m.ticketId || null,
						})),
					);

					const resultId = await updateItinerary({
						data: {
							editId,
							title: value.title,
							description: value.description,
							movements: flatMovements,
							tickets: value.tickets,
						},
					});

					setSuccessData({ id: resultId });
					window.scrollTo({ top: 0, behavior: "smooth" });
				}}
				submitText="変更を保存"
			/>
		</div>
	);
}

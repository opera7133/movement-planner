import { createFileRoute } from "@tanstack/react-router";
import {
	Bus,
	Car,
	CheckCircle2,
	Copy,
	Download,
	Footprints,
	Info,
	JapaneseYen,
	LayoutList,
	MapPin,
	MapPinCheckInside,
	Navigation,
	Plane,
	Table2,
	Train,
} from "lucide-react";
import { useState } from "react";
import type { Movement, Ticket } from "@/db/schema";
import { Card, CardContent } from "../components/ui/card";
import { getItinerary } from "../server/functions";

export const Route = createFileRoute("/i/$id")({
	component: ViewItinerary,
	loader: async ({ params }) => {
		return await getItinerary({ data: params.id });
	},
	head: ({ loaderData }) => ({
		meta: [
			{
				title: `${loaderData?.title} | Movement Planner`,
			},
		],
	}),
});

function MethodIcon({ method }: { method: string }) {
	switch (method.toLowerCase()) {
		case "train":
			return <Train className="h-5 w-5" />;
		case "bus":
			return <Bus className="h-5 w-5" />;
		case "car":
			return <Car className="h-5 w-5" />;
		case "walk":
			return <Footprints className="h-5 w-5" />;
		case "flight":
			return <Plane className="h-5 w-5" />;
		case "stay":
			return <MapPinCheckInside className="h-5 w-5" />;
		default:
			return <Navigation className="h-5 w-5" />;
	}
}

function methodLabel(method: string): string {
	switch (method) {
		case "Train":
			return "鉄道";
		case "Bus":
			return "バス";
		case "Walk":
			return "徒歩";
		case "Car":
			return "車";
		case "Flight":
			return "飛行機";
		case "Stay":
			return "滞在";
		default:
			return method;
	}
}

function ViewItinerary() {
	const itinerary = Route.useLoaderData();
	const [copied, setCopied] = useState(false);
	const [viewMode, setViewMode] = useState<"timeline" | "table">("timeline");

	if (!itinerary) {
		return (
			<div className="mx-auto md:container px-4 py-24 text-center">
				<h1 className="text-3xl font-bold">旅程が見つかりません</h1>
				<p className="text-muted-foreground mt-4">
					リンクが無効か、旅程が削除された可能性があります。
				</p>
			</div>
		);
	}

	const title = itinerary.title || "";
	const description = itinerary.description || "";
	const movements = itinerary.movements as Movement[];
	const tickets = itinerary.tickets as Ticket[];

	// Calculate Totals
	const totalTicketCost = tickets.reduce(
		(sum: number, t: any) => sum + (t.price || 0),
		0,
	);

	const totalFareCost = movements.reduce(
		(sum: number, m: Movement) => sum + (!m.isContinuousFare ? m.fare || 0 : 0),
		0,
	);

	const totalBudget = totalTicketCost + totalFareCost;

	// Calculate Per Day
	const daysObj = movements.reduce(
		(acc, current) => {
			if (!acc[current.day]) {
				acc[current.day] = [];
			}
			acc[current.day].push(current);
			return acc;
		},
		{} as Record<number, typeof movements>,
	);

	// Map to keep exact type compatibility
	const days = daysObj;

	const copyToClipboard = () => {
		navigator.clipboard.writeText(window.location.href);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	// Sorted all movements for table view
	const sortedMovements = [...movements].sort((a, b) => {
		if (a.day !== b.day) return a.day - b.day;
		return a.displayOrder - b.displayOrder;
	});

	const downloadCsv = () => {
		const header =
			"day,departureTime,departurePoint,travelMethod,lineName,arrivalTime,arrivalPoint,fare,isContinuousFare,notes";
		const rows = sortedMovements.map((m) =>
			[
				m.day,
				m.departureTime,
				m.departurePoint,
				m.travelMethod,
				m.lineName ?? "",
				m.arrivalTime,
				m.arrivalPoint,
				m.fare ?? "",
				m.isContinuousFare ? "true" : "",
				m.notes ?? "",
			].join(","),
		);
		const csv = [header, ...rows].join("\n");
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${title || "itinerary"}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="mx-auto md:container md:max-w-4xl px-4 py-10 space-y-8">
			{/* Header section with share button */}
			<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card p-6 rounded-2xl border shadow-sm">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-balance">
						{title || "無題の旅程"}
					</h1>
					{description && (
						<p className="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">
							{description}
						</p>
					)}
					<p className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
						<Info className="h-3.5 w-3.5" />{" "}
						このリンクを知っている人は誰でも旅程を閲覧できます。
					</p>
				</div>
				<div className="flex items-center gap-2 shrink-0">
					<button
						type="button"
						onClick={downloadCsv}
						className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
					>
						<Download className="mr-2 h-4 w-4" />
						CSV
					</button>
					<button
						type="button"
						onClick={copyToClipboard}
						className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
					>
						{copied ? (
							<CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
						) : (
							<Copy className="mr-2 h-4 w-4" />
						)}
						{copied ? "コピーしました！" : "共有する"}
					</button>
				</div>
			</div>

			{/* Summary section */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Card>
					<CardContent className="px-6">
						<div className="text-sm font-medium text-muted-foreground mb-1">
							総予算
						</div>
						<div className="text-2xl font-bold flex items-center gap-1">
							<JapaneseYen className="h-5 w-5" />
							{totalBudget.toLocaleString()}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="px-6">
						<div className="text-sm font-medium text-muted-foreground mb-1">
							きっぷ・パス代
						</div>
						<div className="text-2xl font-bold flex items-center gap-1">
							<JapaneseYen className="h-5 w-5" />
							{totalTicketCost.toLocaleString()}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="px-6">
						<div className="text-sm font-medium text-muted-foreground mb-1">
							個別運賃
						</div>
						<div className="text-2xl font-bold flex items-center gap-1">
							<JapaneseYen className="h-5 w-5" />
							{totalFareCost.toLocaleString()}
						</div>
					</CardContent>
				</Card>
			</div>

			{tickets.length > 0 && (
				<Card className="bg-primary/5 border-primary/20">
					<CardContent className="px-6">
						<h3 className="font-bold mb-4 flex items-center gap-2">
							利用するきっぷ・パス
						</h3>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
							{tickets.map((t: any) => (
								<div
									key={t.id}
									className="bg-background rounded-lg p-3 border shadow-sm flex justify-between items-center"
								>
									<span className="font-medium text-sm">{t.name}</span>
									<span className="text-muted-foreground font-semibold flex items-center text-sm">
										<JapaneseYen className="h-3 w-3" />
										{t.price?.toLocaleString() || 0}
									</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* View mode tabs */}
			<div className="flex items-center gap-1 bg-muted p-1 rounded-lg w-fit">
				<button
					type="button"
					onClick={() => setViewMode("timeline")}
					className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
						viewMode === "timeline"
							? "bg-background text-foreground shadow-sm"
							: "text-muted-foreground hover:text-foreground"
					}`}
				>
					<LayoutList className="h-4 w-4" />
					タイムライン
				</button>
				<button
					type="button"
					onClick={() => setViewMode("table")}
					className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
						viewMode === "table"
							? "bg-background text-foreground shadow-sm"
							: "text-muted-foreground hover:text-foreground"
					}`}
				>
					<Table2 className="h-4 w-4" />
					表形式
				</button>
			</div>

			{/* Timeline view */}
			{viewMode === "timeline" && (
				<div className="space-y-12">
					{Object.entries(days).map(([dayNum, dayMovements]) => (
						<section key={dayNum} className="space-y-6">
							<h2 className="text-2xl font-bold flex items-center gap-3 sticky top-16 z-10 bg-background/95 backdrop-blur py-2 -mx-4 px-4 sm:mx-0 sm:px-0 rounded-lg">
								<span className="bg-primary text-primary-foreground h-10 w-10 text-xl rounded-full flex items-center justify-center">
									{dayNum}
								</span>
								{dayNum}日目
							</h2>

							<div className="relative border-l-2 border-muted ml-5 pl-4 space-y-10 py-4">
								{dayMovements.map((m, idx) => (
									<div key={idx} className="relative">
										{/* Timeline dot */}
										<div className="absolute -left-10.25 top-6 bg-background rounded-full p-1 border-2 border-primary/20">
											<div className="bg-primary/10 text-primary p-2 rounded-full">
												<MethodIcon method={m.travelMethod} />
											</div>
										</div>

										<Card className="hover:shadow-md transition-shadow p-0">
											<CardContent className="p-0">
												<div className="flex flex-col sm:flex-row items-stretch">
													{/* Time block */}
													<div className="bg-muted/30 px-6 py-4 border-b sm:border-b-0 sm:border-r border-border/50 shrink-0 w-full sm:w-48 flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-start gap-4">
														<div className="flex items-center gap-2 text-foreground font-semibold text-lg whitespace-nowrap">
															<MapPin className="h-4 w-4 text-primary" />{" "}
															{m.departureTime}
														</div>

														<div className="hidden sm:block h-8 w-px bg-border my-1 ml-2 border-dashed border-l-2" />
														<div className="sm:hidden w-8 h-px bg-border mx-1 border-dashed border-t-2 grow" />

														<div className="flex items-center gap-2 text-foreground font-semibold text-lg whitespace-nowrap">
															<MapPin className="h-4 w-4 text-destructive" />{" "}
															{m.arrivalTime}
														</div>
													</div>

													{/* Details Block */}
													<div className="p-6 grow flex flex-col justify-center">
														<div className="flex items-center justify-between mb-4 flex-wrap gap-2">
															<div className="flex items-center gap-2 shrink-0 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
																<MethodIcon method={m.travelMethod} />{" "}
																{methodLabel(m.travelMethod)}
																{m.lineName ? ` • ${m.lineName}` : ""}
															</div>

															{m.fare !== null &&
																m.fare !== undefined &&
																!m.isContinuousFare && (
																	<div className="text-muted-foreground flex items-center gap-1 text-sm font-medium bg-muted/50 px-2 py-1 rounded">
																		<JapaneseYen className="h-3 w-3" />{" "}
																		{m.fare.toLocaleString()}
																	</div>
																)}
															{m.isContinuousFare && (
																<div className="text-muted-foreground flex items-center gap-1 text-sm font-medium bg-primary/10 px-2 py-1 rounded">
																	連絡運輸 / 続き
																</div>
															)}
														</div>

														<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
															<div>
																<p className="text-sm text-muted-foreground mb-1 font-medium tracking-wide uppercase text-[10px]">
																	出発
																</p>
																<p className="font-medium text-lg">
																	{m.departurePoint}
																</p>
															</div>
															<div>
																<p className="text-sm text-muted-foreground mb-1 font-medium tracking-wide uppercase text-[10px]">
																	到着
																</p>
																<p className="font-medium text-lg">
																	{m.arrivalPoint}
																</p>
															</div>
														</div>

														{m.notes && (
															<div className="mt-4 pt-4 border-t border-border/50 border-dashed text-sm text-muted-foreground bg-amber-500/5 p-3 rounded-lg">
																<strong>備考:</strong> {m.notes}
															</div>
														)}

														{m.ticketId &&
															tickets.find((t: any) => t.id === m.ticketId) && (
																<div className="mt-2 text-sm text-muted-foreground bg-primary/5 p-3 rounded-lg flex items-center gap-2">
																	<div className="bg-primary/20 p-1 rounded">
																		<Info className="h-3 w-3 text-primary" />
																	</div>
																	<strong>きっぷ:</strong>{" "}
																	{
																		tickets.find(
																			(t: any) => t.id === m.ticketId,
																		)?.name
																	}
																	を使用
																</div>
															)}
													</div>
												</div>
											</CardContent>
										</Card>
									</div>
								))}
							</div>
						</section>
					))}
				</div>
			)}

			{/* Table view */}
			{viewMode === "table" && (
				<div className="rounded-xl border overflow-hidden shadow-sm">
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="bg-muted/60 border-b">
									<th className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">
										日目
									</th>
									<th className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">
										出発時刻
									</th>
									<th className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">
										出発地
									</th>
									<th className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">
										移動手段
									</th>
									<th className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">
										到着時刻
									</th>
									<th className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">
										到着地
									</th>
									<th className="text-right px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">
										運賃
									</th>
									<th className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">
										きっぷ
									</th>
									<th className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">
										備考
									</th>
								</tr>
							</thead>
							<tbody>
								{sortedMovements.map((m, idx) => {
									const ticket = tickets.find((t: any) => t.id === m.ticketId);
									return (
										<tr
											key={idx}
											className={`border-b last:border-b-0 transition-colors hover:bg-muted/30 ${
												idx % 2 === 0 ? "bg-background" : "bg-muted/10"
											}`}
										>
											<td className="px-4 py-3">
												<span className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-6 w-6 inline-flex items-center justify-center">
													{m.day}
												</span>
											</td>
											<td className="px-4 py-3 font-mono font-medium whitespace-nowrap">
												{m.departureTime}
											</td>
											<td className="px-4 py-3 font-medium whitespace-nowrap">
												{m.departurePoint}
											</td>
											<td className="px-4 py-3 whitespace-nowrap">
												<span className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
													<MethodIcon method={m.travelMethod} />
													{methodLabel(m.travelMethod)}
													{m.lineName ? ` • ${m.lineName}` : ""}
												</span>
											</td>
											<td className="px-4 py-3 font-mono font-medium whitespace-nowrap">
												{m.arrivalTime}
											</td>
											<td className="px-4 py-3 font-medium whitespace-nowrap">
												{m.arrivalPoint}
											</td>
											<td className="px-4 py-3 text-right whitespace-nowrap">
												{m.isContinuousFare ? (
													<span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
														↓
													</span>
												) : m.fare != null ? (
													<span className="inline-flex items-center gap-0.5 text-muted-foreground font-semibold">
														<JapaneseYen className="h-3 w-3" />
														{m.fare.toLocaleString()}
													</span>
												) : (
													<span className="text-muted-foreground/40">—</span>
												)}
											</td>
											<td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
												{ticket ? (
													<span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
														{ticket.name}
													</span>
												) : (
													<span className="text-muted-foreground/40">—</span>
												)}
											</td>
											<td className="px-4 py-3 text-muted-foreground max-w-48 truncate">
												{m.notes || (
													<span className="text-muted-foreground/40">—</span>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}

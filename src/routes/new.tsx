import { createFileRoute, Link } from "@tanstack/react-router";
import {
	AlertTriangle,
	CheckCircle2,
	Copy,
	ExternalLink,
	Navigation,
} from "lucide-react";
import { useState } from "react";
import { defaultMovement, ItineraryForm } from "../components/ItineraryForm";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { createItinerary } from "../server/functions";

export const Route = createFileRoute("/new")({
	component: NewItinerary,
	head: () => ({
		meta: [
			{
				title: "新規旅程作成 | Movement Planner",
			},
			{
				name: "robots",
				content: "noindex,nofollow",
			},
		],
	}),
});

function NewItinerary() {
	const [successData, setSuccessData] = useState<{
		id: string;
		editId: string;
	} | null>(null);

	// ---- Success View ----
	if (successData) {
		const publicUrl = `${window.location.origin}/i/${successData.id}`;
		const editUrl = `${window.location.origin}/edit/${successData.editId}`;

		return (
			<div className="md:container md:max-w-3xl px-4 py-12">
				<div className="text-center mb-10">
					<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-6">
						<CheckCircle2 className="w-10 h-10" />
					</div>
					<h1 className="text-3xl font-bold tracking-tight">
						旅程が作成されました！
					</h1>
					<p className="text-muted-foreground mt-2">
						URLをコピーして、友人や家族と共有しましょう。
					</p>
				</div>

				<div className="space-y-6">
					<Card className="border-primary/20 shadow-md">
						<CardHeader className="pb-3">
							<h2 className="text-lg font-semibold flex items-center gap-2">
								<Navigation className="w-5 h-5 text-primary" />
								公開用URL（共有用）
							</h2>
							<p className="text-sm text-muted-foreground">
								このURLを知っている人は誰でも旅程を閲覧できます。
							</p>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2">
								<Input
									readOnly
									value={publicUrl}
									className="font-mono text-sm"
								/>
								<Button
									variant="secondary"
									onClick={() => {
										navigator.clipboard.writeText(publicUrl);
										alert("公開用URLをコピーしました！");
									}}
								>
									<Copy className="w-4 h-4 mr-2" /> コピー
								</Button>
								<Button asChild>
									<Link
										to="/i/$id"
										params={{ id: successData.id }}
										target="_blank"
									>
										<ExternalLink className="w-4 h-4" />
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>

					<Card className="border-amber-500/30 bg-amber-500/5 shadow-md">
						<CardHeader className="pb-3">
							<h2 className="text-lg font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
								<AlertTriangle className="w-5 h-5" />
								編集用URL（秘密にしてください！）
							</h2>
							<p className="text-sm text-amber-700/80 dark:text-amber-400/80">
								このURLを紛失すると、二度と旅程を編集できなくなります。
								<br />
								ブックマークするか、安全な場所に保存してください。
							</p>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2">
								<Input
									readOnly
									value={editUrl}
									className="font-mono text-sm border-amber-500/30 bg-background"
								/>
								<Button
									variant="outline"
									className="border-amber-500/30 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400"
									onClick={() => {
										navigator.clipboard.writeText(editUrl);
										alert(
											"編集用URLをコピーしました！絶対に他人に教えないでください。",
										);
									}}
								>
									<Copy className="w-4 h-4 mr-2" /> コピー
								</Button>
								<Button
									variant="default"
									className="bg-amber-600 hover:bg-amber-700 text-white"
									asChild
								>
									<Link
										to="/edit/$editId"
										params={{ editId: successData.editId }}
									>
										確認する <ExternalLink className="w-4 h-4 ml-1" />
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="mt-12 text-center">
					<Button variant="ghost" asChild>
						<Link to="/">トップページに戻る</Link>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="md:container md:max-w-4xl py-10 px-4">
			<div className="mb-8 space-y-2">
				<h1 className="text-3xl font-bold tracking-tight">新しい旅程を作成</h1>
				<p className="text-muted-foreground">
					旅行の計画を入力してください。必要に応じて複数日や複数の移動を追加できます。
				</p>
			</div>

			<ItineraryForm
				defaultValues={{
					title: "",
					description: "",
					tickets: [],
					days: [
						{
							day: 1,
							movements: [{ ...defaultMovement }],
						},
					],
				}}
				onSubmit={async (value, token) => {
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

					const result = await createItinerary({
						data: {
							title: value.title,
							description: value.description,
							token: token || "",
							movements: flatMovements,
							tickets: value.tickets,
						},
					});

					setSuccessData(result);
					window.scrollTo({ top: 0, behavior: "smooth" });
				}}
				isNew={true}
				submitText="保存してURLを発行"
			/>
		</div>
	);
}

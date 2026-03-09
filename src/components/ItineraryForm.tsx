import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useForm } from "@tanstack/react-form";
import { ClipboardCopy, Navigation, Plus, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

export const movementSchema = z.object({
	departurePoint: z.string().min(1, "必須です"),
	departureTime: z
		.string()
		.regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "HH:MM形式で入力してください"),
	travelMethod: z.string().min(1, "必須です"),
	lineName: z.string().optional(),
	arrivalTime: z
		.string()
		.regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "HH:MM形式で入力してください"),
	arrivalPoint: z.string().min(1, "必須です"),
	fare: z
		.number()
		.min(0)
		.optional()
		.or(z.string().transform((v) => (v === "" ? undefined : Number(v)))),
	notes: z.string().optional(),
});

export const defaultMovement = {
	departurePoint: "",
	departureTime: "",
	travelMethod: "Train",
	lineName: "",
	arrivalTime: "",
	arrivalPoint: "",
	fare: undefined as number | undefined,
	isContinuousFare: false,
	ticketId: undefined as string | undefined,
	notes: "",
};

export type FormValues = {
	title: string;
	description: string;
	tickets: { id: string; name: string; price: number }[];
	days: {
		day: number;
		movements: (typeof defaultMovement)[];
	}[];
};

interface ItineraryFormProps {
	defaultValues: FormValues;
	onSubmit: (values: FormValues, token?: string) => Promise<void>;
	isNew?: boolean;
	submitText: string;
}

export function ItineraryForm({
	defaultValues,
	onSubmit,
	isNew = false,
	submitText,
}: ItineraryFormProps) {
	const [token, setToken] = useState<string>("");
	const [error, setError] = useState<string>("");
	const turnstileRef = useRef<TurnstileInstance>(null);
	const [lastAddedKey, setLastAddedKey] = useState<string | null>(null);
	const movementRefs = useRef<Record<string, HTMLDivElement | null>>({});

	useEffect(() => {
		if (lastAddedKey && movementRefs.current[lastAddedKey]) {
			movementRefs.current[lastAddedKey]?.scrollIntoView({
				behavior: "smooth",
				block: "center",
			});
			setLastAddedKey(null);
		}
	}, [lastAddedKey]);

	const form = useForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			try {
				setError("");
				await onSubmit(value, token);
			} catch (err: any) {
				setError(err.message || "エラーが発生しました");
				if (isNew) {
					turnstileRef.current?.reset();
				}
			}
		},
		onSubmitInvalid: async ({ value }) => {
			try {
				setError("");
				await onSubmit(value, token);
			} catch (err: any) {
				setError(err.message || "エラーが発生しました");
				if (isNew) {
					turnstileRef.current?.reset();
				}
			}
		},
		canSubmitWhenInvalid: true,
	});

	// Grouped inputs for a single movement
	const MovementItem = ({
		dayIndex,
		movementIndex,
		refKey,
	}: {
		dayIndex: number;
		movementIndex: number;
		refKey: string;
	}) => {
		// Read previous movement's arrivalPoint via form state
		const prevArrivalPoint = form.getFieldValue(
			`days[${dayIndex}].movements[${movementIndex > 0 ? movementIndex - 1 : 0}].arrivalPoint` as any,
		);

		return (
			<Card
				className="mb-4 relative border-l-4 border-l-primary/60"
				ref={(el) => {
					movementRefs.current[refKey] = el;
				}}
			>
				<div className="absolute top-4 right-4 z-10">
					<form.Field name={`days[${dayIndex}].movements`}>
						{(field) => (
							<div className="flex bg-muted/50 rounded-md">
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="text-muted-foreground hover:text-foreground h-8 w-8"
									onClick={() => {
										const movements = [...field.state.value];
										if (movementIndex > 0) {
											const temp = movements[movementIndex];
											movements[movementIndex] = movements[movementIndex - 1];
											movements[movementIndex - 1] = temp;
											field.handleChange(movements);
										}
									}}
									disabled={movementIndex === 0}
								>
									<span className="sr-only">Move Up</span>
									<svg
										width="15"
										height="15"
										viewBox="0 0 15 15"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M7.14645 2.14645C7.34171 1.95118 7.65829 1.95118 7.85355 2.14645L11.8536 6.14645C12.0488 6.34171 12.0488 6.65829 11.8536 6.85355C11.6583 7.04882 11.3417 7.04882 11.1464 6.85355L8 3.70711L8 12.5C8 12.7761 7.77614 13 7.5 13C7.22386 13 7 12.7761 7 12.5L7 3.70711L3.85355 6.85355C3.65829 7.04882 3.34171 7.04882 3.14645 6.85355C2.95118 6.65829 2.95118 6.34171 3.14645 6.14645L7.14645 2.14645Z"
											fill="currentColor"
											fillRule="evenodd"
											clipRule="evenodd"
										/>
									</svg>
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="text-muted-foreground hover:text-foreground h-8 w-8"
									onClick={() => {
										const movements = [...field.state.value];
										if (movementIndex < movements.length - 1) {
											const temp = movements[movementIndex];
											movements[movementIndex] = movements[movementIndex + 1];
											movements[movementIndex + 1] = temp;
											field.handleChange(movements);
										}
									}}
									disabled={movementIndex === field.state.value.length - 1}
								>
									<span className="sr-only">Move Down</span>
									<svg
										width="15"
										height="15"
										viewBox="0 0 15 15"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M7.14645 12.8536C7.34171 13.0488 7.65829 13.0488 7.85355 12.8536L11.8536 8.85355C12.0488 8.65829 12.0488 8.34171 11.8536 8.14645C11.6583 7.95118 11.3417 7.95118 11.1464 8.14645L8 11.2929L8 2.5C8 2.22386 7.77614 2 7.5 2C7.22386 2 7 2.22386 7 2.5L7 11.2929L3.85355 8.14645C3.65829 7.95118 3.34171 7.95118 3.14645 8.14645C2.95118 8.34171 2.95118 8.65829 3.14645 8.85355L7.14645 12.8536Z"
											fill="currentColor"
											fillRule="evenodd"
											clipRule="evenodd"
										/>
									</svg>
								</Button>

								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8"
									onClick={() => {
										const movements = [...field.state.value];
										movements.splice(movementIndex, 1);
										field.handleChange(movements);
									}}
									disabled={field.state.value.length === 1}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						)}
					</form.Field>
				</div>
				<CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
					<div className="lg:col-span-3 space-y-2">
						<Label
							htmlFor={`days[${dayIndex}].movements[${movementIndex}].departureTime`}
						>
							出発時刻
						</Label>
						<form.Field
							name={`days[${dayIndex}].movements[${movementIndex}].departureTime`}
							validators={{ onChange: movementSchema.shape.departureTime }}
						>
							{(field) => (
								<div>
									<Input
										id={field.name}
										name={field.name}
										type="time"
										value={(field.state.value as string) || ""}
										onChange={(e) => field.handleChange(e.target.value)}
										className={
											field.state.meta.errors.length ? "border-destructive" : ""
										}
									/>
									{field.state.meta.errors ? (
										<p className="text-xs text-destructive mt-1">
											{field.state.meta.errors.map((e) => e?.message).join(",")}
										</p>
									) : null}
								</div>
							)}
						</form.Field>
					</div>

					<div className="lg:col-span-3 space-y-2">
						<div className="flex items-center gap-2">
							<Label
								htmlFor={`days[${dayIndex}].movements[${movementIndex}].departurePoint`}
							>
								出発地
							</Label>
							{movementIndex > 0 && (
								<form.Field
									name={`days[${dayIndex}].movements[${movementIndex}].departurePoint`}
								>
									{(field) => (
										<Button
											type="button"
											variant="outline"
											size="xs"
											className="text-sm h-3.5 py-1.5 px-0"
											onClick={() => {
												if (prevArrivalPoint) {
													field.handleChange(prevArrivalPoint as string);
												}
											}}
											disabled={!prevArrivalPoint}
										>
											<ClipboardCopy className="h-3 w-3" />
										</Button>
									)}
								</form.Field>
							)}
						</div>
						<form.Field
							name={`days[${dayIndex}].movements[${movementIndex}].departurePoint`}
							validators={{ onChange: movementSchema.shape.departurePoint }}
						>
							{(field) => (
								<div>
									<Input
										id={field.name}
										name={field.name}
										value={(field.state.value as string) || ""}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="例：東京"
									/>
								</div>
							)}
						</form.Field>
					</div>

					<div className="lg:col-span-6 space-y-2">
						<Label
							htmlFor={`days[${dayIndex}].movements[${movementIndex}].travelMethod`}
						>
							移動手段・路線
						</Label>
						<div className="flex gap-2">
							<form.Field
								name={`days[${dayIndex}].movements[${movementIndex}].travelMethod`}
							>
								{(field) => (
									<Select
										name={field.name}
										value={field.state.value}
										onValueChange={field.handleChange}
									>
										<SelectTrigger id={field.name} className="w-27.5">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Train">鉄道</SelectItem>
											<SelectItem value="Bus">バス</SelectItem>
											<SelectItem value="Walk">徒歩</SelectItem>
											<SelectItem value="Car">車</SelectItem>
											<SelectItem value="Flight">飛行機</SelectItem>
											<SelectItem value="Stay">滞在</SelectItem>
										</SelectContent>
									</Select>
								)}
							</form.Field>
							<form.Field
								name={`days[${dayIndex}].movements[${movementIndex}].lineName`}
							>
								{(field) => (
									<Input
										id={field.name}
										name={field.name}
										className="flex-1"
										placeholder="例：山手線"
										value={(field.state.value as string) || ""}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
								)}
							</form.Field>
						</div>
					</div>

					<div className="lg:col-span-3 space-y-2">
						<Label
							htmlFor={`days[${dayIndex}].movements[${movementIndex}].arrivalTime`}
						>
							到着時刻
						</Label>
						<form.Field
							name={`days[${dayIndex}].movements[${movementIndex}].arrivalTime`}
							validators={{ onChange: movementSchema.shape.arrivalTime }}
						>
							{(field) => (
								<div>
									<Input
										id={field.name}
										name={field.name}
										type="time"
										value={(field.state.value as string) || ""}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
								</div>
							)}
						</form.Field>
					</div>

					<div className="lg:col-span-3 space-y-2 lg:col-start-4">
						<Label
							htmlFor={`days[${dayIndex}].movements[${movementIndex}].arrivalPoint`}
						>
							到着地
						</Label>
						<form.Field
							name={`days[${dayIndex}].movements[${movementIndex}].arrivalPoint`}
							validators={{ onChange: movementSchema.shape.arrivalPoint }}
						>
							{(field) => (
								<div>
									<Input
										id={field.name}
										name={field.name}
										value={(field.state.value as string) || ""}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="例：京都"
									/>
								</div>
							)}
						</form.Field>
					</div>

					<div className="lg:col-span-3 space-y-2">
						<Label
							htmlFor={`days[${dayIndex}].movements[${movementIndex}].fare`}
						>
							運賃（円）
						</Label>
						<form.Field
							name={`days[${dayIndex}].movements[${movementIndex}].fare`}
						>
							{(field) => (
								<Input
									id={field.name}
									name={field.name}
									type="number"
									placeholder="0"
									value={(field.state.value as number)?.toString() || ""}
									onChange={(e) =>
										field.handleChange(
											e.target.value === ""
												? undefined
												: Number(e.target.value),
										)
									}
								/>
							)}
						</form.Field>

						<div className="flex items-center space-x-2 pt-2">
							<form.Field
								name={`days[${dayIndex}].movements[${movementIndex}].isContinuousFare`}
							>
								{(field) => (
									<div className="flex items-center gap-2">
										<input
											type="checkbox"
											id={`continuous-${dayIndex}-${movementIndex}`}
											checked={field.state.value as boolean}
											onChange={(e) => field.handleChange(e.target.checked)}
											className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
										/>
										<Label
											htmlFor={`continuous-${dayIndex}-${movementIndex}`}
											className="cursor-pointer text-sm font-normal"
										>
											連絡運輸 / 続き
										</Label>
									</div>
								)}
							</form.Field>
						</div>
					</div>

					<div className="lg:col-span-3 space-y-2">
						<Label
							htmlFor={`days[${dayIndex}].movements[${movementIndex}].ticketId`}
						>
							きっぷ
						</Label>
						<form.Field
							name={`days[${dayIndex}].movements[${movementIndex}].ticketId`}
						>
							{(field) => (
								<form.Subscribe selector={(state) => state.values.tickets}>
									{(tickets) => (
										<Select
											name={field.name}
											value={(field.state.value as string) || "none"}
											onValueChange={(val) =>
												field.handleChange(val === "none" ? undefined : val)
											}
										>
											<SelectTrigger id={field.name} className="w-full">
												<SelectValue placeholder="きっぷ" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="none">指定なし</SelectItem>
												{tickets.map((t: any) => (
													<SelectItem key={t.id} value={t.id}>
														{t.name || "名称未設定"}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								</form.Subscribe>
							)}
						</form.Field>
					</div>
					<div className="lg:col-span-12 space-y-2">
						<Label
							htmlFor={`days[${dayIndex}].movements[${movementIndex}].notes`}
						>
							備考
						</Label>
						<div className="flex gap-2">
							<form.Field
								name={`days[${dayIndex}].movements[${movementIndex}].notes`}
							>
								{(field) => (
									<Input
										id={field.name}
										name={field.name}
										className="flex-1"
										placeholder="例：3番線乗り換え"
										value={(field.state.value as string) || ""}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
								)}
							</form.Field>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	};

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className="space-y-8"
		>
			<Card>
				<CardHeader>
					<form.Field name="title">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name} className="text-lg font-semibold">
									旅程のタイトル（任意）
								</Label>
								<Input
									id={field.name}
									placeholder="例：週末の京都旅行"
									className="text-lg py-6"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							</div>
						)}
					</form.Field>
					<form.Field name="description">
						{(field) => (
							<div className="space-y-2 mt-3">
								<Label
									htmlFor={field.name}
									className="font-medium text-muted-foreground"
								>
									説明・メモ（任意）
								</Label>
								<Textarea
									id={field.name}
									placeholder="例：家族旅行の2泊3日プラン。新幹線と在来線を組み合わせた最安値ルート。"
									rows={3}
									className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none field-sizing-fixed"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							</div>
						)}
					</form.Field>
				</CardHeader>
			</Card>

			{/* CSV Import */}
			<Card className="border-dashed border-2 bg-muted/20">
				<CardContent>
					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
						<div className="space-y-1">
							<h3 className="font-semibold">CSVで行程を一括入力</h3>
							<p className="text-sm text-muted-foreground">
								CSVファイルを読み込むと、行程データを既存のリストに追加します。
							</p>
							<a
								href="/movement_template.csv"
								download="movement_template.csv"
								className="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-2 hover:opacity-80"
							>
								テンプレートをダウンロード
							</a>
						</div>
						<div>
								<label className="shrink-0 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
									CSVファイルを選択
									<input
										type="file"
										accept=".csv,text/csv"
										className="sr-only"
										onChange={(e) => {
											const file = e.target.files?.[0];
											if (!file) return;
											const reader = new FileReader();
											reader.onload = (ev) => {
												const text = ev.target?.result as string;
												const lines = text.split(/\r?\n/).filter(Boolean);
												if (lines.length < 2) return;
												const newMovements = lines.slice(1).map((line) => {
													const cols = line.split(",");
													return {
														day: Number(cols[0]) || 1,
														departureTime: cols[1]?.trim() || "00:00",
														departurePoint: cols[2]?.trim() || "",
														travelMethod: cols[3]?.trim() || "Train",
														lineName: cols[4]?.trim() || "",
														arrivalTime: cols[5]?.trim() || "00:00",
														arrivalPoint: cols[6]?.trim() || "",
														fare: cols[7]?.trim()
															? Number(cols[7].trim())
															: (undefined as number | undefined),
														isContinuousFare:
															cols[8]?.trim().toLowerCase() === "true",
														ticketId: undefined as string | undefined,
														notes: cols[9]?.trim() || "",
													};
												});
												const currentDays = [{
													day: 1,
													movements: []
												}];
												for (const m of newMovements) {
													const dayEntry = currentDays.find(
														(d) => d.day === m.day,
													);
													const { day: _day, ...movementData } = m;
													if (dayEntry) {
														dayEntry.movements = [
															...dayEntry.movements,
															movementData,
														];
													} else {
														currentDays.push({
															day: m.day,
															movements: [movementData],
														});
													}
												}
												currentDays.sort((a, b) => a.day - b.day);
												form.setFieldValue("days", currentDays);
											};
											reader.readAsText(file, "utf-8");
											e.target.value = "";
										}}
									/>
								</label>
							</div>
					</div>
				</CardContent>
			</Card>

			<form.Field name="tickets">
				{(ticketsField) => (
					<Card className="border-primary/20 bg-primary/5">
						<CardHeader className="pb-3 border-b border-border/50">
							<h2 className="text-xl font-bold flex items-center gap-2">
								フリーきっぷ・全体で使う乗車券
							</h2>
							<p className="text-sm text-muted-foreground">
								旅程全体で有効なパスなどを登録し、各移動で適用できます。
							</p>
						</CardHeader>
						<CardContent className="space-y-4">
							{ticketsField.state.value.map((_, tIdx) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: simple array append/remove
								<div key={tIdx} className="flex gap-4 items-center">
									<div className="flex flex-col md:flex-row gap-4 items-start md:items-end w-full">
										<div className="flex-1 space-y-2 w-full">
											<Label htmlFor={`tickets[${tIdx}].name`}>きっぷ名</Label>
											<form.Field name={`tickets[${tIdx}].name`}>
												{(field) => (
													<Input
														id={`tickets[${tIdx}].name`}
														name={`tickets[${tIdx}].name`}
														className="bg-white"
														placeholder="例：青春18きっぷ"
														value={field.state.value}
														onChange={(e) => field.handleChange(e.target.value)}
													/>
												)}
											</form.Field>
										</div>
										<div className="flex-1 space-y-2 w-full">
											<Label htmlFor={`tickets[${tIdx}].price`}>
												料金（円）
											</Label>
											<form.Field name={`tickets[${tIdx}].price`}>
												{(field) => (
													<Input
														id={`tickets[${tIdx}].price`}
														name={`tickets[${tIdx}].price`}
														className="bg-white"
														type="number"
														placeholder="0"
														value={field.state.value?.toString() || ""}
														onChange={(e) =>
															field.handleChange(
																e.target.value === ""
																	? 0
																	: Number(e.target.value),
															)
														}
													/>
												)}
											</form.Field>
										</div>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="text-destructive mb-0.5"
										onClick={() => {
											const newTickets = [...ticketsField.state.value];
											newTickets.splice(tIdx, 1);
											ticketsField.handleChange(newTickets);
										}}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							))}
							<Button
								type="button"
								variant="outline"
								className="w-full border-dashed"
								onClick={() =>
									ticketsField.handleChange([
										...ticketsField.state.value,
										{ id: nanoid(), name: "", price: 0 },
									])
								}
							>
								<Plus className="mr-2 h-4 w-4" /> きっぷを追加
							</Button>
						</CardContent>
					</Card>
				)}
			</form.Field>

			<form.Field name="days">
				{(daysField) => (
					<div className="space-y-8">
						{daysField.state.value.map((day, dIdx) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: simple array append/remove
							<div key={dIdx} className="space-y-4">
								<div className="flex items-center justify-between border-b pb-2">
									<h2 className="text-xl font-bold flex items-center gap-2">
										<span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">
											{day.day}
										</span>
										{day.day}日目
									</h2>
									{dIdx > 0 && (
										<Button
											type="button"
											variant="ghost"
											className="text-destructive"
											onClick={() => {
												const newDays = [...daysField.state.value];
												newDays.splice(dIdx, 1);
												daysField.handleChange(newDays);
											}}
										>
											日を削除
										</Button>
									)}
								</div>

								<form.Field name={`days[${dIdx}].movements`}>
									{(movementsField) => (
										<div className="space-y-4">
											{movementsField.state.value.map((_, mIdx) => (
												// biome-ignore lint/suspicious/noArrayIndexKey: simple array append/remove
												<div key={mIdx} className="space-y-4 relative">
													{mIdx === 0 && (
														<div className="flex justify-center py-0.5 relative z-10">
															<Button
																type="button"
																variant="outline"
																size="sm"
																className="rounded-full shadow-sm text-xs h-7 hover:bg-primary hover:text-primary-foreground transition-colors"
																onClick={() => {
																	const movements = [
																		{ ...defaultMovement },
																		...movementsField.state.value,
																	];
																	movementsField.handleChange(movements);
																	setLastAddedKey(`${dIdx}-0`);
																}}
															>
																<Plus className="mr-1 h-3 w-3" />{" "}
																ここに移動を追加
															</Button>
														</div>
													)}
													<MovementItem
														dayIndex={dIdx}
														movementIndex={mIdx}
														refKey={`${dIdx}-${mIdx}`}
													/>
													<div className="flex justify-center py-0.5 relative z-10">
														<Button
															type="button"
															variant="outline"
															size="sm"
															className="rounded-full shadow-sm text-xs h-7 hover:bg-primary hover:text-primary-foreground transition-colors"
															onClick={() => {
																const movements = [
																	...movementsField.state.value,
																];
																movements.splice(mIdx + 1, 0, {
																	...defaultMovement,
																});
																movementsField.handleChange(movements);
																setLastAddedKey(`${dIdx}-${mIdx + 1}`);
															}}
														>
															<Plus className="mr-1 h-3 w-3" /> ここに移動を追加
														</Button>
													</div>
												</div>
											))}
											{movementsField.state.value.length === 0 && (
												<Button
													type="button"
													variant="outline"
													className="w-full border-dashed py-8 mb-4 h-auto flex flex-col items-center justify-center text-muted-foreground hover:text-primary"
													onClick={() =>
														movementsField.handleChange([
															...movementsField.state.value,
															{ ...defaultMovement },
														])
													}
												>
													<div className="bg-primary/10 p-3 rounded-full mb-3">
														<Plus className="h-6 w-6 text-primary" />
													</div>
													<span className="font-medium text-base text-foreground">
														最初の移動を追加
													</span>
													<span className="text-sm mt-1">
														ここをクリックして、この日の最初の経路を入力してください
													</span>
												</Button>
											)}
										</div>
									)}
								</form.Field>
							</div>
						))}

						<Button
							type="button"
							variant="secondary"
							size="lg"
							className="w-full"
							onClick={() => {
								const nextDayNum =
									daysField.state.value.length > 0
										? Math.max(...daysField.state.value.map((d) => d.day)) + 1
										: 1;
								daysField.handleChange([
									...daysField.state.value,
									{ day: nextDayNum, movements: [{ ...defaultMovement }] },
								]);
							}}
						>
							<Plus className="mr-2 h-5 w-5" /> 別の日を追加
						</Button>
					</div>
				)}
			</form.Field>

			<Card className="border-t-4 border-t-accent mt-8 bg-muted/30">
				<CardContent className="flex flex-col sm:flex-row items-center justify-between gap-6">
					<div className="flex-1">
						{isNew && (
							<Turnstile
								siteKey={
									import.meta.env.VITE_TURNSTILE_SITE_KEY ||
									"1x00000000000000000000AA"
								}
								onSuccess={setToken}
								ref={turnstileRef}
							/>
						)}
						{error && <p className="text-destructive text-sm mt-2">{error}</p>}
					</div>

					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
					>
						{([canSubmit, isSubmitting]) => (
							<Button
								type="submit"
								size="lg"
								className="w-full sm:w-auto text-lg px-8 py-6"
								disabled={
									!canSubmit || isSubmitting || (isNew ? !token : false)
								}
							>
								{isSubmitting
									? isNew
										? "保存中..."
										: "更新中..."
									: submitText}
								<Navigation className="ml-2 h-5 w-5" />
							</Button>
						)}
					</form.Subscribe>
				</CardContent>
			</Card>
		</form>
	);
}

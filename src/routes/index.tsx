import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/")({ component: App });

function App() {
	return (
		<main className="mx-auto container py-24 flex flex-col items-center justify-center min-h-[calc(100vh-140px)] text-center">
			<div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#333_1px,transparent_1px)] bg-size-[16px_16px] mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

			<div className="space-y-6 max-w-3xl">
				<h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-balance bg-linear-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
					移動計画をスマートに。
				</h1>
				<p className="text-xl text-muted-foreground text-balance">
					複数日にわたる旅行の旅程を作成、整理し、誰とでも簡単に共有できます。
					<br />
					会員登録は不要です。
				</p>

				<div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 border-t border-border/50">
					<Button
						size="lg"
						className="h-12 px-8 text-base shadow-lg transition-transform hover:scale-105"
						asChild
					>
						<Link to="/new">新しい旅程を作成</Link>
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left w-full max-w-5xl">
				{[
					{
						title: "無料＆登録不要",
						desc: "アカウントを作成することなく、すぐに計画を始められます。",
						icon: "🌍",
					},
					{
						title: "複数日対応",
						desc: "数日にわたる複雑な旅行も、見やすいタイムラインに整理します。",
						icon: "📅",
					},
					{
						title: "すぐに共有可能",
						desc: "共有用の安全なリンクを取得して、旅行仲間に渡しましょう。",
						icon: "🔗",
					},
				].map((feature) => (
					<div
						key={feature.title}
						className="flex flex-col space-y-2 p-6 rounded-2xl bg-card border shadow-sm"
					>
						<span className="text-3xl mb-2">{feature.icon}</span>
						<h3 className="font-semibold text-lg">{feature.title}</h3>
						<p className="text-muted-foreground">{feature.desc}</p>
					</div>
				))}
			</div>
		</main>
	);
}

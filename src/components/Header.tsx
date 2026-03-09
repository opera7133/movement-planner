import { Link } from "@tanstack/react-router";
import ThemeToggle from "./ThemeToggle";
import { Button } from "./ui/button";

export default function Header() {
	return (
		<header className="sticky top-0 z-50 border-b bg-background/80 px-4 backdrop-blur-lg">
			<nav className="flex h-16 items-center justify-between">
				<h2 className="m-0 text-lg font-bold tracking-tight">
					<Link
						to="/"
						className="flex items-center gap-2 text-foreground no-underline transition-opacity hover:opacity-80"
					>
						Movement Planner
					</Link>
				</h2>

				<div className="flex items-center gap-4">
					<Button variant="default" size="sm" asChild>
						<Link to="/new">旅程を作成</Link>
					</Button>

					<ThemeToggle />
				</div>
			</nav>
		</header>
	);
}

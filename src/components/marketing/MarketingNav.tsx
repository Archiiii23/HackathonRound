import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { meQuery } from "@/lib/queries";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { ArrowRight, Github } from "lucide-react";

export function MarketingNav() {
    const me = useQuery(meQuery());
    const user = me.data?.user;

    return (
        <header className="sticky top-0 z-40 border-b border-border/60 glass">
            <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-6">
                <div className="flex items-center gap-8">
                    <Logo />
                    <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
                        <a href="/#features" className="transition-colors hover:text-foreground">
                            Features
                        </a>
                        <a href="/#preview" className="transition-colors hover:text-foreground">
                            AI Hub
                        </a>
                        <Link to="/pricing" className="transition-colors hover:text-foreground">
                            Pricing
                        </Link>
                        <a
                            href="https://github.com/Archiiii23/HackathonRound"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                        >
                            <Github className="h-3.5 w-3.5" />
                            GitHub
                        </a>
                    </nav>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle className="hidden md:inline-flex" />
                    {user ? (
                        <Button size="sm" asChild className="gap-1.5">
                            <Link to="/app">
                                Open workspace <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </Button>
                    ) : (
                        <>
                            <Button variant="ghost" size="sm" asChild>
                                <Link to="/login">Log in</Link>
                            </Button>
                            <Button size="sm" asChild className="gap-1.5 shadow-[var(--shadow-soft)]">
                                <Link to="/signup">
                                    Start free <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-56 flex-col border-r border-border bg-sidebar">
        <div className="px-5 py-5">
          <p className="text-base font-semibold tracking-tight text-sidebar-foreground">Minders</p>
          <p className="text-xs text-muted-foreground">Bellezza Miami</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          <NavLink
            to="/conversations"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )
            }
          >
            <MessagesSquare className="h-4 w-4" />
            Conversations
          </NavLink>
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <p className="px-2 text-xs text-muted-foreground">Auth disabled</p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

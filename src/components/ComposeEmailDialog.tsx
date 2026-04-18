import { useMemo, useRef, useState } from "react";
import { Mail, Send, Sparkles, UserPlus, X } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { type Customer } from "@/lib/supabase";

const VARIABLES: { key: string; label: string; tone: "blue" | "pink" }[] = [
  { key: "first_name", label: "first name", tone: "blue" },
  { key: "full_name", label: "full name", tone: "blue" },
  { key: "intent", label: "intent", tone: "pink" },
  { key: "occasion", label: "occasion", tone: "pink" },
  { key: "color_family", label: "color family", tone: "pink" },
];

const DEFAULT_TEMPLATE =
  "Dear {first_name},\n\nI noticed you’re interested in {intent} for your {occasion} — I think we have the perfect match in {color_family}.\n\nWorth a quick chat?\n\nBest regards,\nBellezza Miami";

function getName(c: Customer): string {
  const meta = (c.metadata ?? {}) as Record<string, unknown>;
  if (typeof meta.full_name === "string" && meta.full_name) return meta.full_name;
  if (c.email) return c.email;
  return "Anonymous";
}

function initials(name: string) {
  return (
    name
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function resolveVariables(text: string, lead: Customer): string {
  const meta = (lead.metadata ?? {}) as Record<string, unknown>;
  const fullName =
    (typeof meta.full_name === "string" && meta.full_name) || lead.email || "there";
  const firstName = String(fullName).split(/[\s@]/)[0];
  const map: Record<string, string> = {
    first_name: firstName,
    full_name: String(fullName),
    intent: lead.intent ?? "your next set",
    occasion: lead.occasion ?? "next occasion",
    color_family: lead.color_family ?? "favorite shade",
  };
  return text.replace(/\{(\w+)\}/g, (_, k) => map[k] ?? `{${k}}`);
}

/** Renders the body with {variable} pills inline, line-numbered. */
function HighlightedBody({ value }: { value: string }) {
  const lines = value.split("\n");
  return (
    <div className="font-mono text-[13px] leading-6 text-foreground">
      {lines.map((line, i) => {
        const parts = line.split(/(\{\w+\})/g);
        return (
          <div key={i} className="flex gap-4">
            <span className="w-5 shrink-0 select-none text-right text-muted-foreground/60">
              {i + 1}
            </span>
            <span className="min-h-[1.5rem] flex-1 whitespace-pre-wrap break-words">
              {parts.map((p, j) => {
                const m = /^\{(\w+)\}$/.exec(p);
                if (m) {
                  const v = VARIABLES.find((x) => x.key === m[1]);
                  const tone = v?.tone ?? "pink";
                  return (
                    <span
                      key={j}
                      className={cn(
                        "rounded px-1 py-0.5",
                        tone === "blue"
                          ? "bg-sky-100 text-sky-700"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      {p}
                    </span>
                  );
                }
                return <span key={j}>{p}</span>;
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ComposeEmailDialog({
  lead,
  onSend,
  children,
}: {
  lead: Customer;
  onSend: (lead: Customer, channel: "email", body: string) => Promise<boolean>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(DEFAULT_TEMPLATE);
  const [subject, setSubject] = useState("Quick idea for your next set");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const name = getName(lead);
  const lineCount = useMemo(() => body.split("\n").length, [body]);

  function insertVariable(key: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? body.length;
    const end = ta.selectionEnd ?? body.length;
    const token = `{${key}}`;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + token.length;
    });
  }

  async function handleSend() {
    setSending(true);
    const resolvedSubject = resolveVariables(subject, lead);
    const resolvedBody = resolveVariables(body, lead);
    const text = `${resolvedSubject}\n\n${resolvedBody}`;
    const ok = await onSend(lead, "email", text);
    setSending(false);
    if (ok) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="max-w-2xl gap-0 overflow-hidden rounded-2xl border border-border bg-background p-0 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">Compose email</h2>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Recipients */}
        <div className="space-y-2.5 border-b border-border/60 px-6 py-4">
          <div className="flex items-center gap-4">
            <span className="w-12 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              From
            </span>
            <Chip name="Bellezza Miami" verified accent="primary" />
          </div>
          <div className="flex items-center gap-4">
            <span className="w-12 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              To
            </span>
            <Chip name={name} verified />
            <button
              className="ml-1 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              type="button"
            >
              <UserPlus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>

        {/* Subject */}
        <div className="flex items-center gap-4 border-b border-border/60 px-6 py-3">
          <span className="w-12 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Subj
          </span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject…"
            className="flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Body editor — overlay highlighted text behind transparent textarea */}
        <div className="relative px-6 py-4">
          <div className="pointer-events-none absolute inset-x-6 top-4">
            <HighlightedBody value={body} />
          </div>
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            spellCheck={false}
            className="relative block w-full resize-none bg-transparent pl-9 font-mono text-[13px] leading-6 text-transparent caret-primary outline-none selection:bg-primary/20 selection:text-transparent"
            style={{ minHeight: `${Math.max(8, lineCount + 1) * 24}px` }}
          />
        </div>

        {/* Variable chips */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 px-6 py-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Insert
          </span>
          {VARIABLES.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => insertVariable(v.key)}
              className={cn(
                "rounded-full px-2.5 py-1 font-mono text-[11px] transition-colors",
                v.tone === "blue"
                  ? "bg-sky-50 text-sky-700 hover:bg-sky-100"
                  : "bg-primary/10 text-primary hover:bg-primary/15",
              )}
            >
              {`{${v.key}}`}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-6 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground"
              aria-label="Add"
            >
              <span className="text-base leading-none">+</span>
            </button>
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Bellezza tone
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={sending || !body.trim()}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Chip({
  name,
  verified,
  accent,
}: {
  name: string;
  verified?: boolean;
  accent?: "primary";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border bg-background px-2 py-1 pr-2.5 text-sm",
        accent === "primary" ? "border-primary/30" : "border-border",
      )}
    >
      <Avatar className="h-5 w-5">
        <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary">
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      <span className="font-medium text-foreground">{name}</span>
      {verified && (
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-sky-500 text-[8px] font-bold text-white">
          ✓
        </span>
      )}
    </span>
  );
}

// silence unused import warning during typecheck
void Mail;

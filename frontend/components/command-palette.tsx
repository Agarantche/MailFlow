"use client";

import {
  Command,
  CornerDownLeft,
  Inbox,
  LogOut,
  PlugZap,
  RefreshCcw,
  ScanSearch,
  Search,
  Settings
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const OPEN_EVENT = "mailflow:open-command-palette";

type CommandItem = {
  id: string;
  label: string;
  hint: string;
  keywords: string;
  icon: typeof Inbox;
  run: () => Promise<string | void> | string | void;
};

export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function SidebarCommandTrigger() {
  return (
    <button
      className="flex h-11 items-center gap-3 rounded-md border border-border bg-white/70 px-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
      onClick={openCommandPalette}
      type="button"
    >
      <Search className="size-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">Search commands</span>
      <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px]">
        K
      </span>
    </button>
  );
}

export function HeaderCommandTrigger() {
  return (
    <button
      className="ml-auto hidden h-9 min-w-64 items-center gap-2 rounded-md border border-border bg-white/70 px-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 md:flex"
      onClick={openCommandPalette}
      type="button"
    >
      <Command className="size-4" aria-hidden="true" />
      <span className="flex-1">Search, filter, or run actions</span>
      <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px]">
        Ctrl K
      </span>
    </button>
  );
}

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [status, setStatus] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setActiveIndex(0);
    setStatus("");
  }, []);

  const commands = useMemo<CommandItem[]>(
    () => [
      {
        id: "fetch",
        label: "Fetch unread emails",
        hint: "Pull the latest 25 unread Gmail messages",
        keywords: "fetch unread gmail refresh pull sync",
        icon: RefreshCcw,
        run: async () => {
          const result = await postJson("/api/emails/fetch");
          router.push("/dashboard");
          router.refresh();
          return `Fetched ${pluralizeEmails(result.fetched ?? 0)}.`;
        }
      },
      {
        id: "analyze",
        label: "Analyze inbox",
        hint: "Run AI analysis on unanalyzed messages",
        keywords: "analyze ai scan summary priority risk",
        icon: ScanSearch,
        run: async () => {
          const result = await postJson("/api/emails/analyze");
          router.push("/dashboard");
          router.refresh();
          return `Analyzed ${pluralizeEmails(result.analyzed ?? 0)}.`;
        }
      },
      {
        id: "inbox",
        label: "Go to inbox",
        hint: "Open the dashboard",
        keywords: "inbox dashboard home emails",
        icon: Inbox,
        run: () => {
          router.push("/dashboard");
        }
      },
      {
        id: "settings",
        label: "Go to settings",
        hint: "Plan, usage, and account",
        keywords: "settings usage plan upgrade account pro",
        icon: Settings,
        run: () => {
          router.push("/settings");
        }
      },
      {
        id: "connect",
        label: "Connect Gmail",
        hint: "Open the Gmail connection page",
        keywords: "connect gmail google oauth account link",
        icon: PlugZap,
        run: () => {
          router.push("/connect");
        }
      },
      {
        id: "logout",
        label: "Sign out",
        hint: "Clear the local session",
        keywords: "sign out logout exit leave",
        icon: LogOut,
        run: async () => {
          await postJson("/api/auth/logout");
          router.push("/");
          router.refresh();
        }
      }
    ],
    [router]
  );

  const filteredCommands = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return commands;
    }

    return commands.filter((command) =>
      `${command.label} ${command.keywords}`.toLowerCase().includes(normalized)
    );
  }, [commands, query]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((open) => !open);
      }
    }

    function onOpen() {
      setIsOpen(true);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_EVENT, onOpen);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  async function runCommand(command: CommandItem) {
    if (isRunning) {
      return;
    }

    setIsRunning(true);
    setStatus(`Running: ${command.label}...`);

    try {
      const result = await command.run();

      if (result) {
        setStatus(result);
      } else {
        close();
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Command failed.");
    } finally {
      setIsRunning(false);
    }
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      close();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) =>
        filteredCommands.length ? (index + 1) % filteredCommands.length : 0
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        filteredCommands.length
          ? (index - 1 + filteredCommands.length) % filteredCommands.length
          : 0
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const command = filteredCommands[activeIndex];

      if (command) {
        void runCommand(command);
      }
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="mf-fade fixed inset-0 z-50 flex items-start justify-center bg-stone-900/30 px-4 pt-[14vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          close();
        }
      }}
      role="dialog"
    >
      <div className="mf-glass mf-pop w-full max-w-xl overflow-hidden rounded-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            aria-label="Search commands"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Type a command or search..."
            ref={inputRef}
            value={query}
          />
          <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ESC
          </span>
        </div>

        <div className="mf-scroll max-h-80 overflow-y-auto p-2">
          {filteredCommands.length ? (
            filteredCommands.map((command, index) => (
              <button
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                  index === activeIndex
                    ? "bg-primary/[0.12] text-foreground"
                    : "text-muted-foreground hover:bg-black/[0.03] hover:text-foreground"
                )}
                key={command.id}
                onClick={() => void runCommand(command)}
                onMouseEnter={() => setActiveIndex(index)}
                type="button"
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-md border",
                    index === activeIndex
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-white/70"
                  )}
                >
                  <command.icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {command.label}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {command.hint}
                  </span>
                </span>
                {index === activeIndex ? (
                  <CornerDownLeft
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            ))
          ) : (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No commands match &quot;{query}&quot;.
            </p>
          )}
        </div>

        {status ? (
          <div className="border-t border-border px-4 py-2.5">
            <p className="text-xs text-muted-foreground" role="status">
              {status}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

async function postJson(endpoint: string) {
  let response: Response;

  try {
    response = await fetch(endpoint, { method: "POST" });
  } catch {
    throw new Error("Network error. Check your connection and try again.");
  }

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    fetched?: number;
    analyzed?: number;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }

  return payload;
}

function pluralizeEmails(count: number) {
  return `${count} ${count === 1 ? "email" : "emails"}`;
}

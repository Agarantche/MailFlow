"use client";

import { CreditCard } from "lucide-react";
import { useState } from "react";

import { Button } from "@/frontend/components/ui/button";

export function PlanUpgradeButton() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function startCheckout() {
    setIsLoading(true);
    const response = await fetch("/api/subscription/checkout", {
      method: "POST"
    });
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
    };

    setIsLoading(false);
    setMessage(payload.error ?? payload.message ?? "Checkout placeholder ready.");
  }

  return (
    <div className="flex flex-col gap-3">
      <Button disabled={isLoading} onClick={startCheckout}>
        <CreditCard className="size-4" aria-hidden="true" />
        Upgrade to Pro
      </Button>
      {message ? (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}

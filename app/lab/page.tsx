import type { Metadata } from "next";

import { DecisionLab } from "@/frontend/components/decision-lab";

export const metadata: Metadata = {
  title: "Decision Lab — MailFlow",
  description: "An interactive inbox planning lab. Find a feasible day, explore trade-offs, and export your plan."
};

export default function LabPage() {
  return <DecisionLab />;
}

"use client";

import { InvestmentsTable } from "@/components/admin/InvestmentsTable";

export default function InvestmentsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Investments</h1>
      </div>
      <InvestmentsTable />
    </div>
  );
} 
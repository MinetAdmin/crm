import { auth } from "@/auth";
import { listOpportunities } from "@/lib/opportunities";

const HEADER = [
  "Name",
  "Account",
  "Stage",
  "Outcome",
  "Owner",
  "Expected (UGX)",
  "Weighted (UGX)",
  "Probability",
  "Close date",
];

export async function GET(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const params = new URL(request.url).searchParams;
  const rows = await listOpportunities({
    search: params.get("q") ?? undefined,
    outcome: params.get("outcome") ?? undefined,
    stageId: params.get("stage") ?? undefined,
  });

  const lines = [
    HEADER,
    ...rows.map((row) => [
      row.name,
      row.account.name,
      row.stage,
      row.outcome,
      row.owner.name,
      String(row.expected),
      String(row.weighted),
      String(row.probability),
      row.expectedCloseDate,
    ]),
  ];
  const csv = lines.map((cells) => cells.map(csvCell).join(",")).join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="opportunities.csv"',
    },
  });
}

function csvCell(value: string): string {
  const guarded = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(guarded) ? `"${guarded.replaceAll('"', '""')}"` : guarded;
}

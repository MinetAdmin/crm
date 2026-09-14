import { auth } from "@/auth";
import { parseSort, sortAccounts } from "@/lib/account-table";
import { listAccounts } from "@/lib/accounts";

const HEADER = [
  "Name",
  "Sector",
  "Unit",
  "Contacts",
  "Decision maker",
  "Open leads",
  "Open pursuits",
  "Weighted (UGX)",
  "Last movement",
  "Created",
];

export async function GET(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const params = new URL(request.url).searchParams;
  const { key, dir } = parseSort(
    params.get("sort") ?? undefined,
    params.get("dir") ?? undefined,
  );
  const rows = await listAccounts({
    search: params.get("q") ?? undefined,
    unitId: params.get("unit") ?? undefined,
    sectorId: params.get("sector") ?? undefined,
  });
  const accounts = sortAccounts(rows, key, dir);

  const lines = [
    HEADER,
    ...accounts.map((account) => [
      account.name,
      account.sector ?? "",
      account.unit ?? "",
      String(account.contacts),
      account.decisionMaker ? "Named" : "",
      String(account.openLeads),
      String(account.openPursuits),
      String(account.weighted),
      account.lastMovement ?? "",
      account.createdAt,
    ]),
  ];
  const csv = lines.map((cells) => cells.map(csvCell).join(",")).join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="accounts.csv"',
    },
  });
}

function csvCell(value: string): string {
  const guarded = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(guarded) ? `"${guarded.replaceAll('"', '""')}"` : guarded;
}

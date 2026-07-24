interface QueryError {
  message: string;
}

interface PageResult<T> {
  data: T[] | null;
  error: QueryError | null;
}

const PAGE_SIZE = 1_000;

export class ReportDataError extends Error {
  constructor(source: string, message: string) {
    super(`Unable to load ${source}: ${message}`);
    this.name = "ReportDataError";
  }
}

export function assertNoQueryError(
  source: string,
  response: { error: QueryError | null }
) {
  if (response.error) {
    throw new ReportDataError(source, response.error.message);
  }
}

export async function fetchAllReportRows<T>(
  source: string,
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<T>>
) {
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const response = await fetchPage(from, from + PAGE_SIZE - 1);
    assertNoQueryError(source, response);
    const page = response.data ?? [];
    rows.push(...page);

    if (page.length < PAGE_SIZE) break;
  }

  return rows;
}

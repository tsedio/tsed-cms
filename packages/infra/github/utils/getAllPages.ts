export async function getAllPages<T>(callback: (page: number, perPage: number) => Promise<T[]>, perPage: number): Promise<T[]> {
  const items: T[] = [];

  for (let page = 1; page < 100; page++) {
    const pageData = await callback(page, perPage);

    if (!pageData?.length) {
      break;
    }

    items.push(...pageData);

    if (pageData.length < perPage) {
      break;
    } // last page
  }

  return items;
}
export async function getAllPagesGql<T>(
  callback: (after: string | null) => Promise<{ items: T[]; pageInfo?: { hasNextPage?: boolean; endCursor?: string } }>
): Promise<T[]> {
  let after: string | null = null;
  const all: T[] = [];

  while (true) {
    const { items, pageInfo } = await callback(after);

    all.push(...items);

    if (!pageInfo?.hasNextPage) {
      break;
    }

    after = pageInfo?.endCursor || null;
  }

  return all;
}

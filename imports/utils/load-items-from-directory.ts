import fs from "node:fs";
import path from "node:path";

type LoadItemsOptions = {
  /** Use only for optional collections such as relation tables. */
  allowEmpty?: boolean;
};

/**
 * Loads every `items` array from the JSON payloads stored in `<baseDirectory>/<directoryName>/*.json`.
 * Files are read in name order so imports are deterministic.
 */
export function loadItemsFromDirectory<Item = any>(baseDirectory: string, directoryName: string, options: LoadItemsOptions = {}): Item[] {
  const directoryPath = path.join(baseDirectory, directoryName);

  if (!fs.existsSync(directoryPath)) {
    if (options.allowEmpty) {
      return [];
    }

    throw new Error(`Missing collection directory: ${directoryPath}`);
  }

  const items = fs
    .readdirSync(directoryPath)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b))
    .flatMap((fileName) => {
      const content = JSON.parse(fs.readFileSync(path.join(directoryPath, fileName), "utf8"));
      return Array.isArray(content.items) ? content.items : [];
    });

  if (items.length === 0 && !options.allowEmpty) {
    throw new Error(`No items found in ${directoryPath}`);
  }

  return items;
}

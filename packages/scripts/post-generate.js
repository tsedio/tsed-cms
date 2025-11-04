import fs from "fs";
import path from "path";

// Path to the generated schema file
const schemaFilePath = path.resolve("./packages/infra/directus/interfaces/DirectusSchema.d.ts");

// Read the file content
console.log("Reading schema file...");
let content = fs.readFileSync(schemaFilePath, "utf8");

// Regular expression to find translations fields that can be null or undefined with TypeName[] format
// This pattern looks for:
// 1. "translations" field name
// 2. Optional question mark
// 3. Colon
// 4. Any type followed by array notation
// 5. Optional pipe and null type
const translationsTypeArrayRegex = /(translations\??)\s*:\s*([A-Za-z]+)\[\]\s*(\|\s*null)?;/g;

// Replace with non-nullable, required translations field
content = content.replace(translationsTypeArrayRegex, "translations: $2[];");

// Regular expression to find translations fields that can be null or undefined with Array<...> format
// This pattern looks for:
// 1. "translations" field name
// 2. Optional question mark
// 3. Colon
// 4. Array<...> notation
// 5. Optional pipe and null type
const translationsArrayGenericRegex = /(translations\??)\s*:\s*(Array<[^>]+>)\s*(\|\s*null)?;/g;

// Replace with non-nullable, required translations field
content = content.replace(translationsArrayGenericRegex, "translations: $2;");

// Regular expression to find translations fields that can be null or undefined with "json" type
// This pattern looks for:
// 1. "translations" field name
// 2. Optional question mark
// 3. Colon
// 4. "json" type (possibly with quotes)
// 5. Optional pipe and null type
const translationsJsonRegex = /(translations\??)\s*:\s*("json"|'json'|json)\s*(\|\s*null)?;/g;

// Replace with non-nullable, required translations field
content = content.replace(translationsJsonRegex, "translations: $2;");

// Write the modified content back to the file
console.log("Writing modified schema file...");
fs.writeFileSync(schemaFilePath, content, "utf8");

console.log("Post-generation processing completed successfully.");

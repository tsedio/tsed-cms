export interface BenchmarkResult {
  /** @primaryKey */
  id: number;
  /** @required */
  run: BenchmarkRun | string;
  /** @description Date of the run (copied for the charts) */
  date?: string | null;
  /** @description Target name (8.44.12, local, local-head, raw) */
  target?: string | null;
  /** @description version, local or raw */
  target_kind?: "version" | "local" | "raw" | null;
  /** @description Version of a published target */
  target_version?: string | null;
  /** @description Target the others are compared to */
  is_baseline?: boolean | null;
  /** @description HTTP platform */
  platform?: "express" | "koa" | "fastify" | null;
  /** @description Measured route, or startup */
  route?: "hello" | "users" | `orders-create` | `orders-list` | "startup" | null;
  /** @description Median requests per second */
  rps?: number | null;
  /** @description Median latency p50 (ms) */
  p50?: number | null;
  /** @description Median latency p99 (ms) */
  p99?: number | null;
  /** @description Median server CPU time per request (µs) */
  cpu_per_request?: number | null;
  /** @description Failed requests over the rounds */
  errors?: number | null;
  /** @description Median cold start to the first 200 (ms), startup rows only */
  startup_ms?: number | null;
  /** @description req/s of Ts.ED as a % of the same platform without Ts.ED (hello only) */
  share_of_raw?: number | null;
  /** @description Gap of req/s against the baseline, in % (positive is better) */
  gap_rps?: number | null;
  /** @description Low bound of the 95% interval, in % */
  gap_rps_low?: number | null;
  /** @description High bound of the 95% interval, in % */
  gap_rps_high?: number | null;
  /** @description The 95% interval does not contain 0 */
  gap_rps_significant?: boolean | null;
  /** @description Gap of p99 latency against the baseline, in % (positive is better) */
  gap_p99?: number | null;
  /** @description Low bound of the 95% interval, in % */
  gap_p99_low?: number | null;
  /** @description High bound of the 95% interval, in % */
  gap_p99_high?: number | null;
  /** @description The 95% interval does not contain 0 */
  gap_p99_significant?: boolean | null;
  /** @description Gap of CPU per request against the baseline, in % (positive is better) */
  gap_cpu?: number | null;
  /** @description Low bound of the 95% interval, in % */
  gap_cpu_low?: number | null;
  /** @description High bound of the 95% interval, in % */
  gap_cpu_high?: number | null;
  /** @description The 95% interval does not contain 0 */
  gap_cpu_significant?: boolean | null;
  /** @description Gap of cold start against the baseline, in % (positive is better) */
  gap_startup?: number | null;
  /** @description Low bound of the 95% interval, in % */
  gap_startup_low?: number | null;
  /** @description High bound of the 95% interval, in % */
  gap_startup_high?: number | null;
  /** @description The 95% interval does not contain 0 */
  gap_startup_significant?: boolean | null;
}

export interface BenchmarkRun {
  /** @primaryKey */
  id: string;
  date_created?: string | null;
  /** @description Date of the run (results.json) @required */
  date: string;
  /** @description Pull request title, or the compared targets */
  title?: string | null;
  /** @description failed when a target failed the response check */
  status?: "success" | "failed" | null;
  /** @description GitHub event (pull_request, workflow_dispatch) or local */
  trigger?: "pull_request" | "workflow_dispatch" | "local" | null;
  /** @description Branch of the measured head */
  git_ref?: string | null;
  /** @description Commit of the measured head */
  git_sha?: string | null;
  /** @description Pull request number */
  pr_number?: number | null;
  /** @description GitHub Actions run */
  run_url?: string | null;
  /** @description Target the others are compared to */
  baseline?: string | null;
  /** @description Comma-separated targets, baseline first */
  targets?: string | null;
  /** @description Comma-separated platforms */
  platforms?: string | null;
  /** @description Comma-separated routes */
  routes?: string | null;
  /** @description Interleaved rounds */
  rounds?: number | null;
  /** @description Measured seconds per route and round */
  duration?: number | null;
  /** @description Warmup seconds per route */
  warmup?: number | null;
  /** @description autocannon connections */
  connections?: number | null;
  /** @description Seed of the measurement order */
  seed?: number | null;
  /** @description Node.js version */
  node?: string | null;
  /** @description Operating system */
  os?: string | null;
  /** @description CPU model */
  cpu?: string | null;
  /** @description CPU cores */
  cores?: number | null;
  /** @description Server pinned on its own core (taskset): gaps under ~3% are only reliable when true */
  pinned?: boolean | null;
  /** @description Markdown report of the run */
  report?: string | null;
  /** @description Raw results.json */
  raw_results?: Record<string, any> | null;
  /** @description Results of the run */
  results?: BenchmarkResult[] | string[];
}

export interface CliInstallStat {
  /** @primaryKey */
  id: number;
  user_created?: DirectusUser | string | null;
  date_created?: string | null;
  user_updated?: DirectusUser | string | null;
  date_updated?: string | null;
  tsed_version?: string | null;
  platform?: string | null;
  convention?: string | null;
  package_manager?: string | null;
  runtime?: string | null;
  features?: string[] | null;
  /** @required */
  channel: "cli" | "mcp";
  cli_version?: string | null;
  is_success?: boolean | null;
  os?: string | null;
  style?: string | null;
  error_message?: string | null;
  error_name?: string | null;
}

export interface Maintainer {
  /** @primaryKey */
  id: string;
  status?: "published" | "draft" | "archived";
  user_created?: DirectusUser | string | null;
  date_created?: string | null;
  user_updated?: DirectusUser | string | null;
  date_updated?: string | null;
  /** @required */
  username: string;
  email?: string | null;
  avatar?: string | null;
  url?: string | null;
}

export interface Package {
  /** @primaryKey */
  id: string;
  status?: "published" | "draft" | "archived";
  sort?: number | null;
  user_created?: DirectusUser | string | null;
  date_created?: string | null;
  user_updated?: DirectusUser | string | null;
  date_updated?: string | null;
  /** @required */
  name: string;
  icon?: string | null;
  description?: string | null;
  tags?: string[] | null;
  homepage?: string | null;
  downloads?: number | null;
  version?: string | null;
  repository?: string | null;
  npm?: string | null;
  stars?: number | null;
  /** @required */
  type: "official" | "premium" | `3rd-party`;
  bugs?: string | null;
  maintainers?: PackagesMaintainer[] | string[];
}

export interface PackagesMaintainer {
  /** @primaryKey */
  id: number;
  packages_id?: Package | string | null;
  maintainers_id?: Maintainer | string | null;
}

export interface PackageSymbol {
  /** @primaryKey */
  id: string;
  status?: "published" | "draft" | "archived";
  user_created?: DirectusUser | string | null;
  date_created?: string | null;
  user_updated?: DirectusUser | string | null;
  date_updated?: string | null;
  /** @required */
  name: string;
  doc_url?: string | null;
  /** @required */
  package: Package | string;
  versions?: string[] | null;
  deprecated?: boolean | null;
  tags?: string[] | null;
  /** @required */
  type: "decorator" | "class" | "enum" | "function" | "interface" | "const" | "service" | "type";
  markdown_url?: string | null;
  additional_doc_url?: string | null;
}

export interface Repository {
  /** @primaryKey */
  id: string;
  status?: "published" | "draft" | "archived";
  user_created?: DirectusUser | string | null;
  date_created?: string | null;
  user_updated?: DirectusUser | string | null;
  date_updated?: string | null;
  /** @required */
  owner: string;
  /** @required */
  repo: string;
  stars?: number | null;
  url?: string | null;
  maintainers?: RepositoriesMaintainer[] | string[];
}

export interface RepositoriesMaintainer {
  /** @primaryKey */
  id: number;
  repositories_id?: Repository | string | null;
  maintainers_id?: Maintainer | string | null;
}

export interface Settings {
  /** @primaryKey */
  id: string;
  slack?: string | null;
  slack_tracking?: number | null;
}

export interface Sponsor {
  /** @primaryKey */
  id: string;
  status?: "published" | "draft" | "archived";
  sort?: number | null;
  user_created?: DirectusUser | string | null;
  date_created?: string | null;
  user_updated?: DirectusUser | string | null;
  date_updated?: string | null;
  source?: "open_collective" | "github" | "Custom" | null;
  name?: string;
  type?: "user" | "organization" | null;
  email?: string | null;
  description?: string | null;
  company?: string | null;
  twitter?: string | null;
  github?: string | null;
  website?: string | null;
  profile?: string | null;
  avatar?: string | null;
  last_transaction_at?: string | null;
  total_amount_donated?: number | null;
  currency?: "EUR" | "USD" | null;
  last_transaction_amount?: number | null;
  visibility?: "public" | "private" | null;
  tier?: string | null;
  grade?: "supporter" | "premium" | "platinum" | null;
  first_transaction_at?: string | null;
  /** @required */
  login: string;
}

export interface DirectusAccess {
  /** @primaryKey */
  id: string;
  role?: DirectusRole | string | null;
  user?: DirectusUser | string | null;
  policy?: DirectusPolicy | string;
  sort?: number | null;
}

export interface DirectusActivity {
  /** @primaryKey */
  id: number;
  action?: string;
  user?: DirectusUser | string | null;
  timestamp?: string;
  ip?: string | null;
  user_agent?: string | null;
  collection?: string;
  item?: string;
  origin?: string | null;
  revisions?: DirectusRevision[] | string[];
}

export interface DirectusCollection {
  /** @primaryKey */
  collection: string;
  icon?: string | null;
  note?: string | null;
  display_template?: string | null;
  hidden?: boolean;
  singleton?: boolean;
  translations: Array<{ language: string; translation: string; singular: string; plural: string }>;
  archive_field?: string | null;
  archive_app_filter?: boolean;
  archive_value?: string | null;
  unarchive_value?: string | null;
  sort_field?: string | null;
  accountability?: "all" | "activity" | null | null;
  color?: string | null;
  item_duplication_fields?: "json" | null;
  sort?: number | null;
  group?: DirectusCollection | string | null;
  collapse?: string;
  preview_url?: string | null;
  versioning?: boolean;
  status?: "active" | "inactive";
  autosave_revision_interval?: null | 30 | 60 | 300 | 600 | null;
}

export interface DirectusComment {
  /** @primaryKey */
  id: string;
  collection?: DirectusCollection | string;
  item?: string;
  comment?: string;
  date_created?: string | null;
  date_updated?: string | null;
  user_created?: DirectusUser | string | null;
  user_updated?: DirectusUser | string | null;
}

export interface DirectusField {
  /** @primaryKey */
  id: number;
  collection?: DirectusCollection | string;
  field?: string;
  special?: string[] | null;
  interface?: string | null;
  options?: "json" | null;
  display?: string | null;
  display_options?: "json" | null;
  readonly?: boolean;
  hidden?: boolean;
  sort?: number | null;
  width?: string | null;
  translations: "json";
  note?: string | null;
  conditions?: "json" | null;
  required?: boolean | null;
  group?: DirectusField | string | null;
  validation?: "json" | null;
  validation_message?: string | null;
  searchable?: boolean;
}

export interface DirectusFile {
  /** @primaryKey */
  id: string;
  storage?: string;
  filename_disk?: string | null;
  filename_download?: string;
  title?: string | null;
  type?: string | null;
  folder?: DirectusFolder | string | null;
  uploaded_by?: DirectusUser | string | null;
  created_on?: string;
  modified_by?: DirectusUser | string | null;
  modified_on?: string;
  charset?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  embed?: string | null;
  description?: string | null;
  location?: string | null;
  tags?: string[] | null;
  metadata?: "json" | null;
  focal_point_x?: number | null;
  focal_point_y?: number | null;
  tus_id?: string | null;
  tus_data?: "json" | null;
  uploaded_on?: string | null;
}

export interface DirectusFolder {
  /** @primaryKey */
  id: string;
  name?: string;
  parent?: DirectusFolder | string | null;
  type?: "files" | "flows";
}

export interface DirectusMigration {
  /** @primaryKey */
  version: string;
  name?: string;
  timestamp?: string | null;
}

export interface DirectusPermission {
  /** @primaryKey */
  id: number;
  collection?: string;
  action?: string;
  permissions?: "json" | null;
  validation?: "json" | null;
  presets?: "json" | null;
  fields?: string[] | null;
  policy?: DirectusPolicy | string;
}

export interface DirectusPolicy {
  /** @primaryKey */
  id: string;
  /** @required */
  name: string;
  icon?: string;
  description?: string | null;
  ip_access?: string[] | null;
  enforce_tfa?: boolean;
  admin_access?: boolean;
  app_access?: boolean;
  permissions?: DirectusPermission[] | string[];
  users?: DirectusAccess[] | string[];
  roles?: DirectusAccess[] | string[];
}

export interface DirectusPreset {
  /** @primaryKey */
  id: number;
  bookmark?: string | null;
  user?: DirectusUser | string | null;
  role?: DirectusRole | string | null;
  collection?: string | null;
  search?: string | null;
  layout?: string | null;
  layout_query?: "json" | null;
  layout_options?: "json" | null;
  refresh_interval?: number | null;
  filter?: "json" | null;
  icon?: string | null;
  color?: string | null;
  uuid?: string | null;
}

export interface DirectusRelation {
  /** @primaryKey */
  id: number;
  many_collection?: string;
  many_field?: string;
  one_collection?: string | null;
  one_field?: string | null;
  one_collection_field?: string | null;
  one_allowed_collections?: string[] | null;
  junction_field?: string | null;
  sort_field?: string | null;
  one_deselect_action?: string;
}

export interface DirectusRevision {
  /** @primaryKey */
  id: number;
  activity?: DirectusActivity | string;
  collection?: string;
  item?: string;
  data?: "json" | null;
  delta?: "json" | null;
  parent?: DirectusRevision | string | null;
  version?: DirectusVersion | string | null;
}

export interface DirectusRole {
  /** @primaryKey */
  id: string;
  /** @required */
  name: string;
  icon?: string;
  description?: string | null;
  parent?: DirectusRole | string | null;
  children?: DirectusRole[] | string[];
  policies?: DirectusAccess[] | string[];
  users?: DirectusUser[] | string[];
}

export interface DirectusSession {
  /** @primaryKey */
  token: string;
  user?: DirectusUser | string | null;
  expires?: string;
  ip?: string | null;
  user_agent?: string | null;
  share?: DirectusShare | string | null;
  origin?: string | null;
  next_token?: string | null;
  oauth_client?: DirectusOauthClient | string | null;
}

export interface DirectusSettings {
  /** @primaryKey */
  id: number;
  project_name?: string;
  project_url?: string | null;
  project_color?: string;
  project_logo?: DirectusFile | string | null;
  public_foreground?: DirectusFile | string | null;
  public_background?: DirectusFile | string | null;
  public_note?: string | null;
  auth_login_attempts?: number | null;
  auth_password_policy?:
    | null
    | `/^.{8,}$/`
    | `/(?=^.{8,}$)(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+}{';'?>.<,])(?!.*\\s).*$/`
    | null;
  storage_asset_transform?: "all" | "none" | "presets" | null;
  storage_asset_presets?: Array<{
    key: string;
    fit: "contain" | "cover" | "inside" | "outside";
    width: number;
    height: number;
    quality: number;
    withoutEnlargement: boolean;
    format: "auto" | "jpeg" | "png" | "webp" | "tiff" | "avif";
    transforms: "json";
  }> | null;
  custom_css?: string | null;
  storage_default_folder?: DirectusFolder | string | null;
  basemaps?: Array<{ name: string; type: "raster" | "tile" | "style"; url: string; tileSize: number; attribution: string }> | null;
  mapbox_key?: string | null;
  module_bar?: "json" | null;
  project_descriptor?: string | null;
  default_language?: string;
  custom_aspect_ratios?: Array<{ text: string; value: number }> | null;
  public_favicon?: DirectusFile | string | null;
  default_appearance?: "auto" | "light" | "dark";
  default_theme_light?: string | null;
  theme_light_overrides?: "json" | null;
  default_theme_dark?: string | null;
  theme_dark_overrides?: "json" | null;
  report_error_url?: string | null;
  report_bug_url?: string | null;
  report_feature_url?: string | null;
  public_registration?: boolean;
  public_registration_verify_email?: boolean;
  public_registration_role?: DirectusRole | string | null;
  public_registration_email_filter?: "json" | null;
  visual_editor_urls?: Array<{ url: string }> | null;
  project_id?: string | null;
  mcp_enabled?: boolean;
  mcp_allow_deletes?: boolean;
  mcp_prompts_collection?: string | null;
  mcp_system_prompt_enabled?: boolean;
  mcp_system_prompt?: string | null;
  project_owner?: string | null;
  project_usage?: string | null;
  org_name?: string | null;
  product_updates?: boolean | null;
  project_status?: string | null;
  ai_openai_api_key?: string | null;
  ai_anthropic_api_key?: string | null;
  ai_system_prompt?: string | null;
  ai_google_api_key?: string | null;
  ai_openai_compatible_api_key?: string | null;
  ai_openai_compatible_base_url?: string | null;
  ai_openai_compatible_name?: string | null;
  ai_openai_compatible_models?: Array<{
    id: string;
    name: string;
    context: number;
    output: number;
    attachment: boolean;
    reasoning: boolean;
    providerOptions: Record<string, any>;
  }> | null;
  ai_openai_compatible_headers?: Array<{ header: string; value: string }> | null;
  ai_openai_allowed_models?: Array<
    | `gpt-4o-mini`
    | `gpt-4.1-mini`
    | `gpt-4.1`
    | `gpt-5-nano`
    | `gpt-5-mini`
    | `gpt-5`
    | `gpt-5.1`
    | `gpt-5.2`
    | `gpt-5.2-pro`
    | `gpt-5.4-nano`
    | `gpt-5.4-mini`
    | `gpt-5.4`
    | `gpt-5.4-pro`
    | `gpt-5.5`
    | `gpt-5.5-pro`
    | `gpt-5.6-luna`
    | `gpt-5.6-terra`
    | `gpt-5.6-sol`
    | `gpt-5.6`
    | `gpt-6-luna`
    | `gpt-6-sol`
    | `gpt-6-astra`
    | `gpt-6.1-sol`
  > | null;
  ai_anthropic_allowed_models?: Array<
    | `claude-haiku-5-5`
    | `claude-sonnet-5-5`
    | `claude-opus-5-5`
    | `claude-fable-5-1`
    | `claude-sonnet-5`
    | `claude-opus-5`
    | `claude-fable-5`
    | `claude-opus-4-8`
    | `claude-haiku-4-5`
    | `claude-sonnet-4-6`
    | `claude-opus-4-7`
    | `claude-opus-4-6`
  > | null;
  ai_google_allowed_models?: Array<
    | `gemini-3-flash-preview`
    | `gemini-2.5-pro`
    | `gemini-2.5-flash`
    | `gemini-3.8-flash`
    | `gemini-3.7-flash`
    | `gemini-3.6-flash`
    | `gemini-3.5-flash`
    | `gemini-3.5-flash-lite`
    | `gemini-3.1-flash-lite`
    | `gemini-3.1-pro-preview`
    | `gemini-2.5-flash-lite`
  > | null;
  collaborative_editing_enabled?: boolean;
  ai_translation_default_model?: string | null;
  ai_translation_glossary?: Array<{ term: string; translation_note: string }> | null;
  ai_translation_style_guide?: string | null;
  license_key?: string | null;
  license_token?: string | null;
  mcp_oauth_enabled?: boolean;
  /** @description Allow MCP clients to register automatically using the OAuth 2.0 Dynamic Client Registration protocol (RFC 7591). */
  mcp_oauth_dcr_enabled?: boolean;
  /** @description Allow MCP clients to identify themselves using an HTTPS URL that hosts their metadata (IETF draft-oauth-client-id-metadata-document). */
  mcp_oauth_cimd_enabled?: boolean;
  default_save_action?: `save-and-quit` | `save-and-stay` | `save-and-create-new`;
  preview_base_url?: string | null;
  default_exports_folder?: DirectusFolder | string | null;
}

export interface DirectusUser {
  /** @primaryKey */
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  password?: string | null;
  location?: string | null;
  title?: string | null;
  description?: string | null;
  tags?: string[] | null;
  avatar?: DirectusFile | string | null;
  language?: string | null;
  tfa_secret?: string | null;
  status?: "draft" | "invited" | "unverified" | "active" | "suspended" | "archived" | `inactive-license`;
  role?: DirectusRole | string | null;
  token?: string | null;
  last_access?: string | null;
  last_page?: string | null;
  provider?: "github";
  external_identifier?: string | null;
  auth_data?: "json" | null;
  email_notifications?: boolean | null;
  appearance?: null | "auto" | "light" | "dark" | null;
  theme_dark?: string | null;
  theme_light?: string | null;
  theme_light_overrides?: "json" | null;
  theme_dark_overrides?: "json" | null;
  text_direction?: "auto" | "ltr" | "rtl";
  policies?: DirectusAccess[] | string[];
}

export interface DirectusDashboard {
  /** @primaryKey */
  id: string;
  name?: string;
  icon?: string;
  note?: string | null;
  date_created?: string | null;
  user_created?: DirectusUser | string | null;
  color?: string | null;
  panels?: DirectusPanel[] | string[];
}

export interface DirectusPanel {
  /** @primaryKey */
  id: string;
  dashboard?: DirectusDashboard | string;
  name?: string | null;
  icon?: string | null;
  color?: string | null;
  show_header?: boolean;
  note?: string | null;
  type?: string;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
  options?: "json" | null;
  date_created?: string | null;
  user_created?: DirectusUser | string | null;
}

export interface DirectusNotification {
  /** @primaryKey */
  id: number;
  timestamp?: string | null;
  status?: string | null;
  recipient?: DirectusUser | string;
  sender?: DirectusUser | string | null;
  subject?: string;
  message?: string | null;
  collection?: string | null;
  item?: string | null;
}

export interface DirectusShare {
  /** @primaryKey */
  id: string;
  name?: string | null;
  collection?: DirectusCollection | string;
  item?: string;
  role?: DirectusRole | string | null;
  password?: string | null;
  user_created?: DirectusUser | string | null;
  date_created?: string | null;
  date_start?: string | null;
  date_end?: string | null;
  times_used?: number | null;
  max_uses?: number | null;
}

export interface DirectusFlow {
  /** @primaryKey */
  id: string;
  name?: string;
  icon?: string | null;
  color?: string | null;
  description?: string | null;
  status?: string;
  trigger?: string | null;
  accountability?: string | null;
  options?: "json" | null;
  operation?: DirectusOperation | string | null;
  date_created?: string | null;
  user_created?: DirectusUser | string | null;
  folder?: DirectusFolder | string | null;
  operations?: DirectusOperation[] | string[];
}

export interface DirectusOperation {
  /** @primaryKey */
  id: string;
  name?: string | null;
  key?: string;
  type?: string;
  position_x?: number;
  position_y?: number;
  options?: "json" | null;
  resolve?: DirectusOperation | string | null;
  reject?: DirectusOperation | string | null;
  flow?: DirectusFlow | string;
  date_created?: string | null;
  user_created?: DirectusUser | string | null;
}

export interface DirectusTranslation {
  /** @primaryKey */
  id: string;
  /** @required */
  language: string;
  /** @required */
  key: string;
  /** @required */
  value: string;
}

export interface DirectusVersion {
  /** @primaryKey */
  id: string;
  key?: string;
  name?: string | null;
  collection?: DirectusCollection | string;
  item?: string;
  hash?: string | null;
  date_created?: string | null;
  date_updated?: string | null;
  user_created?: DirectusUser | string | null;
  user_updated?: DirectusUser | string | null;
  delta?: "json" | null;
}

export interface DirectusExtension {
  enabled?: boolean;
  /** @primaryKey */
  id: string;
  folder?: string;
  source?: string;
  bundle?: string | null;
}

export interface DirectusDeployment {
  /** @primaryKey */
  id: string;
  provider?: string;
  credentials?: string | null;
  options?: "json" | null;
  date_created?: string | null;
  user_created?: DirectusUser | string | null;
  webhook_ids?: "json" | null;
  webhook_secret?: string | null;
  last_synced_at?: string | null;
  projects?: DirectusDeploymentProject[] | string[];
}

export interface DirectusDeploymentProject {
  /** @primaryKey */
  id: string;
  deployment?: DirectusDeployment | string;
  external_id?: string;
  name?: string;
  date_created?: string | null;
  user_created?: DirectusUser | string | null;
  url?: string | null;
  framework?: string | null;
  deployable?: boolean;
  runs?: DirectusDeploymentRun[] | string[];
}

export interface DirectusDeploymentRun {
  /** @primaryKey */
  id: string;
  project?: DirectusDeploymentProject | string;
  external_id?: string;
  target?: string;
  date_created?: string | null;
  user_created?: DirectusUser | string | null;
  status?: string | null;
  url?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface DirectusOauthClient {
  /** @primaryKey */
  client_id: string;
  client_name?: string;
  redirect_uris?: "json";
  grant_types?: "json";
  token_endpoint_auth_method?: string;
  client_secret_hash?: string | null;
  registration_type?: string;
  client_uri?: string | null;
  logo_uri?: string | null;
  tos_uri?: string | null;
  policy_uri?: string | null;
  metadata_fetched_at?: string | null;
  metadata_expires_at?: string | null;
  metadata_etag?: string | null;
  date_created?: string;
  tokens?: DirectusOauthToken[] | string[];
}

export interface DirectusOauthCode {
  /** @primaryKey */
  id: string;
  code_hash?: string;
  client?: DirectusOauthClient | string;
  user?: DirectusUser | string;
  redirect_uri?: string;
  resource?: string;
  code_challenge?: string;
  code_challenge_method?: string;
  scope?: string | null;
  expires_at?: string;
  used_at?: string | null;
}

export interface DirectusOauthConsent {
  /** @primaryKey */
  id: string;
  user?: DirectusUser | string;
  client?: DirectusOauthClient | string;
  redirect_uri?: string;
  scope?: string | null;
  date_created?: string;
  date_updated?: string;
}

export interface DirectusOauthToken {
  /** @primaryKey */
  id: string;
  client?: DirectusOauthClient | string;
  user?: DirectusUser | string;
  session?: string;
  previous_session?: string | null;
  resource?: string;
  code_hash?: string;
  scope?: string | null;
  expires_at?: string;
  date_created?: string;
}

export interface Schema {
  benchmark_results: BenchmarkResult[];
  benchmark_runs: BenchmarkRun[];
  cli_install_stats: CliInstallStat[];
  maintainers: Maintainer[];
  packages: Package[];
  packages_maintainers: PackagesMaintainer[];
  package_symbols: PackageSymbol[];
  repositories: Repository[];
  repositories_maintainers: RepositoriesMaintainer[];
  settings: Settings;
  sponsors: Sponsor[];
  directus_access: DirectusAccess[];
  directus_activity: DirectusActivity[];
  directus_collections: DirectusCollection[];
  directus_comments: DirectusComment[];
  directus_fields: DirectusField[];
  directus_files: DirectusFile[];
  directus_folders: DirectusFolder[];
  directus_migrations: DirectusMigration[];
  directus_permissions: DirectusPermission[];
  directus_policies: DirectusPolicy[];
  directus_presets: DirectusPreset[];
  directus_relations: DirectusRelation[];
  directus_revisions: DirectusRevision[];
  directus_roles: DirectusRole[];
  directus_sessions: DirectusSession[];
  directus_settings: DirectusSettings;
  directus_users: DirectusUser[];
  directus_dashboards: DirectusDashboard[];
  directus_panels: DirectusPanel[];
  directus_notifications: DirectusNotification[];
  directus_shares: DirectusShare[];
  directus_flows: DirectusFlow[];
  directus_operations: DirectusOperation[];
  directus_translations: DirectusTranslation[];
  directus_versions: DirectusVersion[];
  directus_extensions: DirectusExtension[];
  directus_deployments: DirectusDeployment[];
  directus_deployment_projects: DirectusDeploymentProject[];
  directus_deployment_runs: DirectusDeploymentRun[];
  directus_oauth_clients: DirectusOauthClient[];
  directus_oauth_codes: DirectusOauthCode[];
  directus_oauth_consents: DirectusOauthConsent[];
  directus_oauth_tokens: DirectusOauthToken[];
}

export enum CollectionNames {
  benchmark_results = "benchmark_results",
  benchmark_runs = "benchmark_runs",
  cli_install_stats = "cli_install_stats",
  maintainers = "maintainers",
  packages = "packages",
  packages_maintainers = "packages_maintainers",
  package_symbols = "package_symbols",
  repositories = "repositories",
  repositories_maintainers = "repositories_maintainers",
  settings = "settings",
  sponsors = "sponsors",
  directus_access = "directus_access",
  directus_activity = "directus_activity",
  directus_collections = "directus_collections",
  directus_comments = "directus_comments",
  directus_fields = "directus_fields",
  directus_files = "directus_files",
  directus_folders = "directus_folders",
  directus_migrations = "directus_migrations",
  directus_permissions = "directus_permissions",
  directus_policies = "directus_policies",
  directus_presets = "directus_presets",
  directus_relations = "directus_relations",
  directus_revisions = "directus_revisions",
  directus_roles = "directus_roles",
  directus_sessions = "directus_sessions",
  directus_settings = "directus_settings",
  directus_users = "directus_users",
  directus_dashboards = "directus_dashboards",
  directus_panels = "directus_panels",
  directus_notifications = "directus_notifications",
  directus_shares = "directus_shares",
  directus_flows = "directus_flows",
  directus_operations = "directus_operations",
  directus_translations = "directus_translations",
  directus_versions = "directus_versions",
  directus_extensions = "directus_extensions",
  directus_deployments = "directus_deployments",
  directus_deployment_projects = "directus_deployment_projects",
  directus_deployment_runs = "directus_deployment_runs",
  directus_oauth_clients = "directus_oauth_clients",
  directus_oauth_codes = "directus_oauth_codes",
  directus_oauth_consents = "directus_oauth_consents",
  directus_oauth_tokens = "directus_oauth_tokens"
}

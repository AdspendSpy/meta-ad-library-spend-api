#!/usr/bin/env node
// Offline check of the AdSpendSpy Make app (contract: docs/AUTOMATIONS.md). Node built-ins only.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const fail = (msg) => errors.push(msg);

const ALLOWED_PATHS = [
  'brands/list.php', 'brands/search-tracked.php', 'brands/track.php', 'projects/get.php',
  'ads/new.php', 'alerts/list.php', 'webhooks/subscribe.php', 'webhooks/unsubscribe.php', 'webhooks/list.php',
];
const FORBIDDEN = [/meta api/i, /scraper/i, /\bbest\b/i];

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const full = path.join(dir, e.name);
  if (e.isDirectory()) return e.name === 'node_modules' || e.name === '.secrets' ? [] : walk(full);
  return [full];
});
const files = walk(ROOT);
const rel = (f) => path.relative(ROOT, f);

// 1. Parse every JSON file.
const json = {};
for (const f of files.filter((f) => f.endsWith('.json'))) {
  try { json[rel(f)] = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { fail(`invalid JSON: ${rel(f)} (${e.message})`); }
}

// 2. Forbidden wording in every text file.
for (const f of files.filter((f) => /\.(json|md|mjs)$/.test(f))) {
  if (f.endsWith(path.join('scripts', 'check.mjs'))) continue;
  const text = fs.readFileSync(f, 'utf8');
  for (const re of FORBIDDEN) if (re.test(text)) fail(`forbidden wording ${re} in ${rel(f)}`);
}

// 3. Manifest and components.
const manifest = json['makecomapp.json'];
if (!manifest) fail('makecomapp.json missing');
const app = manifest?.app ?? {};
if (app.name !== 'adspendspy') fail('app.name must be adspendspy');
if (app.label !== 'AdSpendSpy') fail('app.label must be AdSpendSpy');
if (String(app.theme).toLowerCase() !== '#1877f2') fail('app.theme must be #1877F2');
if (app.language !== 'en') fail('app.language must be en');
const icon = path.join(ROOT, 'assets', 'icon-512.png');
if (!fs.existsSync(icon)) fail('assets/icon-512.png missing');
else {
  const buf = fs.readFileSync(icon);
  if (buf.toString('ascii', 1, 4) !== 'PNG' || buf.readUInt32BE(16) !== 512 || buf.readUInt32BE(20) !== 512) fail('icon must be a 512x512 PNG');
}
for (const [key, file] of Object.entries(manifest?.generalCodeFiles ?? {})) {
  if (!fs.existsSync(path.join(ROOT, file))) fail(`general ${key} file missing: ${file}`);
}

const required = {
  connection: { adspendspy: null },
  webhook: { newAd: null, newSpendAlert: null },
  module: {
    watchNewAdsInstant: 'instant_trigger', watchSpendAlertsInstant: 'instant_trigger',
    watchNewAds: 'trigger', watchSpendAlerts: 'trigger',
    trackBrand: 'action', searchTrackedBrands: 'search', makeApiCall: 'universal',
  },
  rpc: { listTrackedBrands: null, listProjects: null },
};
const comps = manifest?.components ?? {};
for (const [kind, names] of Object.entries(required)) {
  for (const [name, type] of Object.entries(names)) {
    const c = comps[kind]?.[name];
    if (!c) { fail(`${kind} ${name} missing`); continue; }
    if (type && c.moduleType !== type) fail(`module ${name} must be ${type}`);
    for (const [code, file] of Object.entries(c.codeFiles ?? {})) {
      if (!json[file]) fail(`${kind} ${name}: code file ${code} missing or invalid: ${file}`);
    }
  }
}
const code = (kind, name, key) => json[comps[kind]?.[name]?.codeFiles?.[key]];

if (comps.connection?.adspendspy?.label !== 'AdSpendSpy API key') fail('connection label must be "AdSpendSpy API key"');
const connParams = code('connection', 'adspendspy', 'params') ?? [];
const apiKey = connParams.find((p) => p.name === 'apiKey');
if (!apiKey || apiKey.type !== 'password' || apiKey.required !== true) fail('connection param apiKey must be a required password');

const base = json['general/base.iml.json'] ?? {};
if (base.baseUrl !== 'https://www.adspendspy.com/api/v1') fail('base.baseUrl wrong');
if (base.headers?.Authorization !== 'Bearer {{connection.apiKey}}') fail('base Authorization header wrong');
if (!String(base.response?.error?.message ?? '').includes('{{body.message}}')) fail('base error message must use {{body.message}}');
if (base.response?.error?.['402']?.message !== 'AdSpendSpy automations need a paid plan.') fail('base 402 message wrong');
if (!(base.log?.sanitize ?? []).includes('request.headers.authorization')) fail('base must sanitize the Authorization header');

for (const [name, event] of [['newAd', 'ad.new'], ['newSpendAlert', 'ad.spend_alert']]) {
  const c = comps.webhook?.[name];
  if (c && c.webhookType !== 'web-dedicated') fail(`webhook ${name} must be dedicated`);
  const attach = code('webhook', name, 'attach');
  if (attach?.body?.event !== event || attach?.body?.platform !== 'make' || attach?.body?.target_url !== '{{webhook.url}}') fail(`webhook ${name}: attach body wrong`);
  if (attach?.response?.data?.id !== '{{body.webhook.id}}') fail(`webhook ${name}: attach must store {{body.webhook.id}}`);
  if (code('webhook', name, 'detach')?.body?.id !== '{{webhook.id}}') fail(`webhook ${name}: detach body wrong`);
}
for (const [name, hook] of [['watchNewAdsInstant', 'newAd'], ['watchSpendAlertsInstant', 'newSpendAlert']]) {
  if (comps.module?.[name] && comps.module[name].webhook !== hook) fail(`module ${name} must use webhook ${hook}`);
}

// 4. Polling triggers paginate.
for (const [name, idPath] of [['watchNewAds', 'ad.internal_ad_id'], ['watchSpendAlerts', 'alert.alert_id']]) {
  const comm = code('module', name, 'communication');
  if (!comm) continue;
  if (comm.qs?.limit !== 100) fail(`${name}: limit must be 100`);
  if (comm.pagination?.qs?.cursor !== '{{body.pagination.next_cursor}}' || comm.pagination?.condition !== '{{body.pagination.has_more}}') fail(`${name}: pagination missing or wrong`);
  const t = comm.response?.trigger ?? {};
  if (t.type !== 'id' || t.order !== 'desc' || t.id !== `{{item.${idPath}}}`) fail(`${name}: trigger must be id desc on ${idPath}`);
  if (!code('module', name, 'epoch')) fail(`${name}: epoch missing`);
}

// 5. Every used API path is allowed.
const urlOf = (obj, out = []) => {
  if (Array.isArray(obj)) obj.forEach((v) => urlOf(v, out));
  else if (obj && typeof obj === 'object') for (const [k, v] of Object.entries(obj)) { if (k === 'url' && typeof v === 'string') out.push(v); else urlOf(v, out); }
  return out;
};
const iml = Object.entries(json).filter(([f]) => f.endsWith('.communication.iml.json') || f.endsWith('.attach.iml.json') || f.endsWith('.detach.iml.json') || f.endsWith('.epoch.iml.json'));
for (const [f, data] of iml) {
  if (f.startsWith('modules/makeApiCall/')) continue; // universal module: user-chosen relative path
  for (const url of urlOf(data)) {
    if (url.includes('{{')) { fail(`${f}: dynamic url ${url}`); continue; }
    const p = url.replace(/^https:\/\/www\.adspendspy\.com\/api\/v1/, '').replace(/^\//, '');
    if (!ALLOWED_PATHS.includes(p)) fail(`${f}: path not allowed: ${url}`);
  }
}
const universal = code('module', 'makeApiCall', 'mappableParams') ?? [];
for (const p of ['url', 'method', 'headers', 'qs', 'body']) if (!universal.some((x) => x.name === p)) fail(`makeApiCall: param ${p} missing`);

// 6. RPC outputs.
const rpcOut = (name) => code('rpc', name, 'communication');
if (rpcOut('listTrackedBrands')?.url !== '/brands/list.php' || rpcOut('listTrackedBrands')?.response?.output?.value !== '{{item.page_id}}') fail('listTrackedBrands wrong');
if (rpcOut('listProjects')?.url !== '/projects/get.php' || rpcOut('listProjects')?.response?.output?.value !== '{{item.public_id}}') fail('listProjects wrong');

if (errors.length) {
  console.error(`check failed (${errors.length}):\n- ` + errors.join('\n- '));
  process.exit(1);
}
console.log(`ok: ${Object.keys(json).length} JSON files, ${Object.values(comps).reduce((n, c) => n + Object.keys(c).length, 0)} components`);

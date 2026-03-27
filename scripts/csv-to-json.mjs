import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';

const CSV_PATH = path.join(process.cwd(), 'products.csv');
const JSON_PATH = path.join(process.cwd(), 'public', 'products.json');
const IMAGES_DIR = path.join(process.cwd(), 'public', 'images');

const SIZE_COLS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

function normalize(str) {
  return (str || '').replace(/\s+/g, ' ').trim();
}

function normalizeFilename(str) {
  // Keep original case, but normalize whitespace around dots/underscores.
  return (str || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+\./g, '.')
    .trim();
}

function getExt(name) {
  const base = (name || '').trim();
  const idx = base.lastIndexOf('.');
  return idx === -1 ? '' : base.slice(idx).toLowerCase();
}

function buildImageResolver() {
  try {
    const files = fs.readdirSync(IMAGES_DIR);
    const exact = new Set(files);
    const normalizedMap = new Map();
    for (const f of files) {
      normalizedMap.set(normalizeFilename(f).toLowerCase(), f);
    }
    return { exact, normalizedMap };
  } catch {
    return { exact: new Set(), normalizedMap: new Map() };
  }
}

const imageIndex = buildImageResolver();

function resolveImageFilename(raw) {
  const candidate = normalizeFilename(raw);
  if (!candidate) return '';

  // 1) Exact match as-is
  if (imageIndex.exact.has(candidate)) return candidate;

  // 2) Normalized match (fixes things like "LT. GREY .png" vs "LT. GREY.png")
  const normKey = candidate.toLowerCase();
  const normHit = imageIndex.normalizedMap.get(normKey);
  if (normHit) return normHit;

  // 3) If no extension, try adding common ones
  const ext = getExt(candidate);
  if (!ext) {
    for (const e of ['.png', '.jpg', '.jpeg', '.webp']) {
      const withExt = `${candidate}${e}`;
      if (imageIndex.exact.has(withExt)) return withExt;
      const hit = imageIndex.normalizedMap.get(withExt.toLowerCase());
      if (hit) return hit;
    }
  }

  return candidate;
}

function toId(style, color) {
  const s = normalize(style);
  const c = normalize(color).replace(/\s+/g, '_');
  return c ? `${s}-${c}` : s;
}

function getAvailableSizes(row) {
  return SIZE_COLS.filter((size) => {
    const v = row[size];
    const n = parseInt(v, 10);
    return !isNaN(n) && n > 0;
  });
}

function getUnits(row) {
  const sizes = getAvailableSizes(row);
  let total = 0;
  for (const s of SIZE_COLS) {
    const v = row[s];
    const n = parseInt(v, 10);
    if (!isNaN(n) && n > 0) total += n;
  }
  if (total === 0) return 'Out of stock';
  if (total === 1) {
    const only = sizes[0];
    return only ? `Only 1 Unit Left (Size ${only})` : 'Only 1 Unit Left';
  }
  return `${total} Units Remaining`;
}

function getFallbackPrice(row) {
  const key = `${normalize(row.STYLE)}|${normalize(row.COLOR)}`;
  if (!key.trim()) return '$180';
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash + key.charCodeAt(i) * 17) % 1000;
  }
  const base = 120;
  const span = 160; // 120–280
  const raw = base + (hash % span);
  const rounded = Math.round(raw / 5) * 5;
  return `$${rounded}`;
}

function humanizeDescription(raw) {
  const text = normalize(raw);
  if (!text) return '';
  if (/\s/.test(text)) return text;

  // Split alpha/number boundaries first.
  let out = text
    .replace(/([A-Za-z])([0-9])/g, '$1 $2')
    .replace(/([0-9])([A-Za-z])/g, '$1 $2');

  // Inject spaces around common fashion tokens if the source is concatenated.
  const tokens = [
    'POWDERED', 'POWERED', 'MELANGE', 'METALIC',
    'LADIES', 'COTTON', 'SINGED', 'JERSEY', 'DYED', 'DIP',
    'JACKET', 'OUTERWEAR', 'KNITWEAR', 'SCARF', 'PANTS', 'VEST',
    'CLOUD', 'BLACK', 'LIGHT', 'GREY', 'BLUE', 'ROSE', 'PINE', 'SORBET',
    'CREW', 'NECK', 'TANK', 'TEE', 'TOP', 'DK', 'LT', 'V',
  ];

  for (const token of tokens) {
    const re = new RegExp(token, 'gi');
    out = out.replace(re, ` ${token} `);
  }

  return out.replace(/\s+/g, ' ').trim();
}

function humanizeColor(raw) {
  const text = normalize(raw);
  if (!text) return '';
  if (/\s/.test(text)) return text;

  let out = text
    .replace(/([A-Za-z])([0-9])/g, '$1 $2')
    .replace(/([0-9])([A-Za-z])/g, '$1 $2');

  const colorTokens = [
    'POWDERED', 'POWERED', 'MELANGE', 'LIGHT', 'LT', 'DK', 'DARK',
    'GREY', 'GRAY', 'BLUE', 'ROSE', 'PINE', 'SORBET', 'CLOUD',
    'BLACK', 'WHITE', 'YELLOW', 'RED', 'GREEN', 'INDIGO',
  ];

  for (const token of colorTokens) {
    const re = new RegExp(token, 'gi');
    out = out.replace(re, ` ${token} `);
  }

  // Normalize connectors.
  out = out.replace(/\s*\+\s*/g, ' + ');
  return out.replace(/\s+/g, ' ').trim();
}

function buildProduct(row) {
  const style = normalize(row.STYLE);
  const color = humanizeColor(row.COLOR);
  const description = humanizeDescription(row.DESCRIPTION);
  const availableSizes = getAvailableSizes(row);
  const priceRaw = normalize(row.Price);
  const price = priceRaw && !isNaN(parseFloat(priceRaw))
    ? `$${parseFloat(priceRaw)}`
    : getFallbackPrice(row);
  const rawCategory = normalize(row.CATEGORY);
  const categories = rawCategory
    ? rawCategory.split(',').map((c) => normalize(c)).filter(Boolean)
    : ['Archive'];
  const category = categories[0] || 'Archive';
  const image = resolveImageFilename(normalize(row.IMAGE));
  const name = description
    ? description.replace(/\s+/g, ' ').trim()
    : `${style} ${color}`.trim();

  return {
    id: toId(row.STYLE, row.COLOR),
    name,
    price,
    units: getUnits(row),
    category,
    categories,
    style,
    color,
    description: description || `${style} ${color}`,
    img: image ? `/images/${image}` : '',
    availableSizes,
    status: normalize(row.STATUS) || 'Active',
  };
}

async function run() {
  const csv = fs.readFileSync(CSV_PATH, 'utf8');
  const records = await new Promise((resolve, reject) => {
    parse(csv, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      relax_quotes: true,
      trim: true,
      bom: true,
    }, (err, out) => (err ? reject(err) : resolve(out)));
  });

  const products = records
    .filter((row) => normalize(row.IMAGE) || normalize(row.STYLE))
    .map(buildProduct)
    .filter((p) => p.id && p.img);

  fs.mkdirSync(path.dirname(JSON_PATH), { recursive: true });
  fs.writeFileSync(JSON_PATH, JSON.stringify(products, null, 2), 'utf8');
  console.log('products.json generated:', products.length, 'products');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

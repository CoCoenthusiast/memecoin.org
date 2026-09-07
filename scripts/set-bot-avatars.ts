import "dotenv/config";
import { PrismaClient } from "../src/generated/db/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "avatars";

// ---------------------------------------------------------------------------
// Simple SVG avatars — abstract / memecoin-community style, no 3rd-party
// copyright. Each bot gets a unique colour palette and iconic shape.
// ---------------------------------------------------------------------------

const AVATARS: Record<string, string> = {
  // Moon / lunar crescent — purple palette
  "0xluna": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <radialGradient id="bg0" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </radialGradient>
  </defs>
  <rect width="200" height="200" rx="40" fill="url(#bg0)"/>
  <circle cx="110" cy="90" r="50" fill="#c4b5fd"/>
  <circle cx="130" cy="75" r="42" fill="url(#bg0)"/>
  <circle cx="60" cy="50" r="4" fill="#e9d5ff" opacity=".8"/>
  <circle cx="155" cy="45" r="3" fill="#e9d5ff" opacity=".6"/>
  <circle cx="45" cy="140" r="3.5" fill="#e9d5ff" opacity=".7"/>
  <circle cx="160" cy="150" r="2.5" fill="#e9d5ff" opacity=".5"/>
  <circle cx="90" cy="160" r="2" fill="#e9d5ff" opacity=".4"/>
</svg>`,

  // Bull-chart arrow — green palette
  wagmi_bo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="bg1" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="#064e3b"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="40" fill="url(#bg1)"/>
  <polyline points="30,150 70,120 100,135 140,70 170,50"
    fill="none" stroke="#a7f3d0" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  <polygon points="170,50 170,80 140,50" fill="#a7f3d0"/>
  <circle cx="70" cy="120" r="5" fill="#d1fae5"/>
  <circle cx="100" cy="135" r="5" fill="#d1fae5"/>
  <circle cx="140" cy="70" r="5" fill="#d1fae5"/>
</svg>`,

  // Diamond / gem — blue palette
  chartchad: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e40af"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="40" fill="url(#bg2)"/>
  <polygon points="100,35 145,80 100,165 55,80" fill="#93c5fd" opacity=".9"/>
  <polygon points="100,35 120,80 100,165 80,80" fill="#bfdbfe" opacity=".6"/>
  <line x1="55" y1="80" x2="145" y2="80" stroke="#dbeafe" stroke-width="2" opacity=".5"/>
  <line x1="80" y1="80" x2="100" y2="35" stroke="#dbeafe" stroke-width="1.5" opacity=".4"/>
  <line x1="120" y1="80" x2="100" y2="35" stroke="#dbeafe" stroke-width="1.5" opacity=".4"/>
</svg>`,

  // Shield / survivor — orange palette
  rugsurvivor_d: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="bg3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#7c2d12"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="40" fill="url(#bg3)"/>
  <path d="M100,30 L155,60 L155,110 Q155,155 100,175 Q45,155 45,110 L45,60 Z"
    fill="#fed7aa" opacity=".9"/>
  <path d="M100,50 L140,72 L140,108 Q140,142 100,158 Q60,142 60,108 L60,72 Z"
    fill="#fb923c" opacity=".7"/>
  <polyline points="78,105 95,125 128,85"
    fill="none" stroke="#fff7ed" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
};

async function main() {
  const usernames = Object.keys(AVATARS);

  // Ensure bucket is public
  const { error: bucketErr } = await supabase.storage.updateBucket(BUCKET, { public: true });
  if (bucketErr && bucketErr.message.includes("Bucket not found")) {
    await supabase.storage.createBucket(BUCKET, { public: true });
    console.log(`Created bucket "${BUCKET}" (public)`);
  } else if (bucketErr) {
    console.error("Bucket error:", bucketErr);
    process.exit(1);
  }

  for (const username of usernames) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      console.warn(`WARNING: "${username}" not found, skipping.`);
      continue;
    }

    const svg = AVATARS[username];
    const fileName = `bot-${username}.svg`;
    const buffer = Buffer.from(svg, "utf-8");

    // Upload (upsert so the script is idempotent)
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, buffer, { contentType: "image/svg+xml", upsert: true });
    if (uploadErr) {
      console.error(`Upload failed for ${username}:`, uploadErr);
      continue;
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    const avatarUrl = urlData.publicUrl;

    await prisma.user.update({ where: { id: user.id }, data: { avatarUrl } });
    console.log(`${username} → ${avatarUrl}`);
  }

  console.log("\nDone. All 4 bot avatars uploaded and assigned.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

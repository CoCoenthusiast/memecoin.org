import "dotenv/config";
import { PrismaClient } from "../src/generated/db/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CHANNELS = [
  { slug: "general", name: "General Chat", description: "Open discussion about memecoins and trading" },
  { slug: "pnl-flex", name: "PnL Flex", description: "Post your profit/loss screenshots and results" },
  { slug: "questions", name: "Questions", description: "Q&A / help channel" },
  { slug: "wallet-tracker", name: "Wallet Tracker List", description: "Share and discuss wallet addresses worth following" },
  { slug: "twitter-tracker", name: "Twitter Tracker List", description: "Share and discuss Twitter/X accounts worth following" },
  { slug: "best-setup", name: "Best Setup", description: "Share your trading setups, tools, and workflows" },
  { slug: "solana", name: "Solana", description: "Solana-chain memecoins discussion" },
  { slug: "robinhood", name: "Robinhood", description: "Robinhood-related token discussion" },
];

async function main() {
  console.log("Seeding database...");

  for (const ch of CHANNELS) {
    await prisma.channel.upsert({
      where: { slug: ch.slug },
      update: {},
      create: ch,
    });
  }
  console.log("Channels created.");

  const password = await bcrypt.hash("password123", 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "alice@example.com" },
      update: {},
      create: { username: "alice", email: "alice@example.com", password },
    }),
    prisma.user.upsert({
      where: { email: "bob@example.com" },
      update: {},
      create: { username: "bob", email: "bob@example.com", password },
    }),
    prisma.user.upsert({
      where: { email: "charlie@example.com" },
      update: {},
      create: { username: "charlie", email: "charlie@example.com", password },
    }),
    prisma.user.upsert({
      where: { email: "diana@example.com" },
      update: {},
      create: { username: "diana", email: "diana@example.com", password },
    }),
  ]);
  console.log("Users created.");

  const [alice, bob, charlie, diana] = users;

  const postsData = [
    // General Chat
    { channel: "general", authorId: alice.id, title: "What memecoins are you watching this week?", body: "I've been looking at a few new launches on Solana. Anyone else keeping track of the latest tickers? Let's share some thoughts." },
    { channel: "general", authorId: bob.id, title: "How do you spot a promising memecoin?", body: "I'm trying to refine my approach. What metrics or signals do you look at before aping into a new project? Community? Liquidity? Dev activity?" },
    { channel: "general", authorId: charlie.id, title: "Market sentiment seems bearish today", body: "Everything is red. Are we expecting a recovery or is this the start of a longer dip? Curious what everyone thinks." },

    // PnL Flex
    { channel: "pnl-flex", authorId: diana.id, title: "Turned $50 into $500 this week", body: "Not a massive bag but I'm happy with the result. Caught a decent pump on a low-cap token and sold at the right time. Screenshot attached (placeholder)." },
    { channel: "pnl-flex", authorId: bob.id, title: "My biggest loss so far this month", body: "Got rekt on a rug. Lost about 2 SOL. Posting this as a reminder to always DYOR and check for basic red flags like locked liquidity." },

    // Questions
    { channel: "questions", authorId: alice.id, title: "How do I set up a Phantom wallet?", body: "I'm new to crypto and I keep hearing about Phantom wallet. Can someone walk me through the setup process? Is it safe to use for memecoin trading?" },
    { channel: "questions", authorId: charlie.id, title: "What is slippage and what should I set it to?", body: "I see slippage settings in my DEX but I don't fully understand what it does. What's a safe slippage percentage for memecoin trades?" },
    { channel: "questions", authorId: diana.id, title: "Best resources for learning about tokenomics?", body: "I want to understand tokenomics better so I can evaluate projects more critically. Any recommended guides or courses?" },

    // Wallet Tracker
    { channel: "wallet-tracker", authorId: bob.id, title: "Follow this wallet for early entries", body: "This address has been consistently early on new launches. They seem to have good alpha. Worth keeping an eye on their moves." },
    { channel: "wallet-tracker", authorId: alice.id, title: "Whale wallet accumulating $PEPE", body: "Noticed a large wallet stacking Pepe over the past week. Could be signaling something." },

    // Twitter Tracker
    { channel: "twitter-tracker", authorId: charlie.id, title: "This account calls pumps consistently", body: "Been following this account for a month and they've called 3 decent pumps. Not financial advice but interesting to watch." },
    { channel: "twitter-tracker", authorId: diana.id, title: "Follow these alpha accounts", body: "Here's my curated list of Twitter accounts that share good memecoin analysis and timely calls." },

    // Best Setup
    { channel: "best-setup", authorId: alice.id, title: "My trading setup: dual monitors + bots", body: "Running a 27-inch main display for charts and a secondary vertical monitor for Twitter and Discord. Using a custom bot for sniping new launches." },
    { channel: "best-setup", authorId: bob.id, title: "What tools do you use for chart analysis?", body: "I'm currently using DexScreener and TradingView. Anyone found better tools for memecoin-specific charting?" },

    // Solana
    { channel: "solana", authorId: charlie.id, title: "Solana memecoins are heating up again", body: "Seems like volume is picking up on Solana DEXs. What projects are you watching on Solana right now?" },
    { channel: "solana", authorId: diana.id, title: "Best Solana launchpads for new memecoins", body: "Looking for reliable launchpads to find new Solana memecoin projects early. What platforms do you recommend?" },
    { channel: "solana", authorId: alice.id, title: "Solana network fees comparison", body: "How much are you paying in fees per swap on Solana vs Ethereum? Seems like Solana is much cheaper for small trades." },

    // Robinhood
    { channel: "robinhood", authorId: bob.id, title: "Thoughts on Robinhood listing new tokens?", body: "Robinhood has been adding more tokens lately. How do you think this affects the memecoin market? More retail access could mean bigger moves." },
    { channel: "robinhood", authorId: charlie.id, title: "Robinhood vs dedicated exchange for memecoins", body: "Is Robinhood good enough for memecoin trading or should I use a dedicated DEX? Pros and cons?" },
  ];

  const posts = [];
  for (const p of postsData) {
    const channel = await prisma.channel.findUnique({ where: { slug: p.channel } });
    if (!channel) continue;
    const post = await prisma.post.create({
      data: {
        title: p.title,
        body: p.body,
        authorId: p.authorId,
        channelId: channel.id,
      },
    });
    posts.push(post);
  }
  console.log(`${posts.length} posts created.`);

  const repliesData = [
    { postIndex: 0, authorId: bob.id, body: "I've been watching the same. The volume on some of these is crazy." },
    { postIndex: 0, authorId: charlie.id, body: "Check out the new ticker that just launched. Looks promising." },
    { postIndex: 1, authorId: diana.id, body: "I look at liquidity lock first. If it's not locked, I pass." },
    { postIndex: 1, authorId: alice.id, body: "Community engagement on social media is also a big signal for me." },
    { postIndex: 2, authorId: bob.id, body: "Probably a dip before the weekend. Markets usually recover." },
    { postIndex: 3, authorId: alice.id, body: "Nice work! What was the ticker?" },
    { postIndex: 3, authorId: diana.id, body: "Consistent small wins add up. Good strategy." },
    { postIndex: 5, authorId: bob.id, body: "Install the browser extension, create a wallet, write down your seed phrase, and you're set." },
    { postIndex: 5, authorId: charlie.id, body: "Make sure you buy a hardware wallet if you're holding significant amounts." },
    { postIndex: 6, authorId: alice.id, body: "I usually set slippage to 5-10% for memecoins. Safer that way." },
    { postIndex: 10, authorId: bob.id, body: "Thanks for sharing! Following them now." },
    { postIndex: 12, authorId: diana.id, body: "I use a similar setup. The vertical monitor for socials is key." },
    { postIndex: 16, authorId: charlie.id, body: "Solana is way cheaper. I do most of my small trades there." },
  ];

  for (const r of repliesData) {
    if (r.postIndex >= posts.length) continue;
    await prisma.reply.create({
      data: {
        body: r.body,
        authorId: r.authorId,
        postId: posts[r.postIndex].id,
      },
    });
  }
  console.log(`${repliesData.length} replies created.`);

  const reactionsData = [
    { type: "Like", userId: alice.id, postIndex: 0 },
    { type: "Funny", userId: bob.id, postIndex: 0 },
    { type: "Like", userId: charlie.id, postIndex: 1 },
    { type: "Sad", userId: diana.id, postIndex: 2 },
    { type: "Like", userId: alice.id, postIndex: 3 },
    { type: "Like", userId: bob.id, postIndex: 4 },
    { type: "Dislike", userId: charlie.id, postIndex: 4 },
    { type: "Like", userId: diana.id, postIndex: 5 },
    { type: "Like", userId: alice.id, postIndex: 10 },
    { type: "Like", userId: charlie.id, postIndex: 13 },
  ];

  for (const r of reactionsData) {
    if (r.postIndex >= posts.length) continue;
    await prisma.reaction.create({
      data: {
        type: r.type,
        userId: r.userId,
        postId: posts[r.postIndex].id,
      },
    });
  }
  console.log(`${reactionsData.length} reactions created.`);

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

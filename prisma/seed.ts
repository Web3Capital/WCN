import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) throw new Error("DATABASE_URL or POSTGRES_URL required");

const pool = new pg.Pool({
  connectionString: url,
  ssl: url.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ADMIN_ID = "cmnqb2flj0000fpxvy1knukcw"; // Stephen

async function main() {
  console.log("🌱 Seeding WCN demo data...\n");

  // ── USERS ──────────────────────────────────────────────────────────────
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "alice@web3capital.io" },
      update: {},
      create: {
        name: "Alice Chen",
        email: "alice@web3capital.io",
        role: "NODE_OWNER",
        accountStatus: "ACTIVE",
      },
    }),
    prisma.user.upsert({
      where: { email: "bob@defiventures.com" },
      update: {},
      create: {
        name: "Bob Zhang",
        email: "bob@defiventures.com",
        role: "CAPITAL_NODE",
        accountStatus: "ACTIVE",
      },
    }),
    prisma.user.upsert({
      where: { email: "carol@tokenbridge.xyz" },
      update: {},
      create: {
        name: "Carol Wang",
        email: "carol@tokenbridge.xyz",
        role: "SERVICE_NODE",
        accountStatus: "ACTIVE",
      },
    }),
    prisma.user.upsert({
      where: { email: "david@cryptofund.hk" },
      update: {},
      create: {
        name: "David Li",
        email: "david@cryptofund.hk",
        role: "CAPITAL_NODE",
        accountStatus: "ACTIVE",
      },
    }),
    prisma.user.upsert({
      where: { email: "eva@chainresearch.io" },
      update: {},
      create: {
        name: "Eva Huang",
        email: "eva@chainresearch.io",
        role: "REVIEWER",
        accountStatus: "ACTIVE",
      },
    }),
    prisma.user.upsert({
      where: { email: "frank@riskdesk.co" },
      update: {},
      create: {
        name: "Frank Liu",
        email: "frank@riskdesk.co",
        role: "RISK_DESK",
        accountStatus: "ACTIVE",
      },
    }),
  ]);
  const [alice, bob, carol, david, eva, frank] = users;
  console.log(`✓ ${users.length} demo users created`);

  // ── WORKSPACE ──────────────────────────────────────────────────────────
  const workspace = await prisma.workspace.upsert({
    where: { slug: "wcn-global" },
    update: {},
    create: {
      name: "WCN Global",
      slug: "wcn-global",
      description: "Primary workspace for the Web3 Capital Network",
      status: "ACTIVE",
    },
  });

  await prisma.workspaceMembership.upsert({
    where: { userId_workspaceId: { userId: ADMIN_ID, workspaceId: workspace.id } },
    update: {},
    create: { userId: ADMIN_ID, workspaceId: workspace.id, isPrimary: true, status: "ACTIVE" },
  });
  for (const u of users) {
    await prisma.workspaceMembership.upsert({
      where: { userId_workspaceId: { userId: u.id, workspaceId: workspace.id } },
      update: {},
      create: { userId: u.id, workspaceId: workspace.id, status: "ACTIVE" },
    });
  }
  console.log(`✓ Workspace "${workspace.name}" with ${users.length + 1} members`);

  // ── NODES ──────────────────────────────────────────────────────────────
  const nodeData = [
    { name: "WCN Global HQ", type: "GLOBAL" as const, status: "LIVE" as const, owner: ADMIN_ID, region: "Global", description: "Core orchestration node for the entire WCN network", tags: ["orchestration", "governance", "settlement"] },
    { name: "Asia Pacific Hub", type: "REGION" as const, status: "LIVE" as const, owner: alice.id, region: "Asia Pacific", description: "Regional hub covering APAC crypto markets", tags: ["asia", "defi", "institutional"] },
    { name: "Shanghai Capital Node", type: "CITY" as const, status: "LIVE" as const, owner: bob.id, region: "Asia Pacific", city: "Shanghai", description: "Capital deployment node focused on DeFi and infrastructure", tags: ["capital", "defi", "infrastructure"] },
    { name: "Hong Kong Finance Node", type: "CITY" as const, status: "LIVE" as const, owner: david.id, region: "Asia Pacific", city: "Hong Kong", description: "Institutional capital and compliance-focused node", tags: ["institutional", "compliance", "otc"] },
    { name: "Singapore Growth Node", type: "CITY" as const, status: "ACTIVE" as const, owner: carol.id, region: "Asia Pacific", city: "Singapore", description: "Growth-stage project acceleration and market expansion", tags: ["growth", "market-expansion", "southeast-asia"] },
    { name: "DeFi Research Lab", type: "INDUSTRY" as const, status: "LIVE" as const, owner: eva.id, region: "Global", description: "Specialized research and due diligence for DeFi protocols", tags: ["research", "defi", "due-diligence"] },
    { name: "Web3 Legal Services", type: "FUNCTIONAL" as const, status: "ACTIVE" as const, owner: carol.id, region: "Global", description: "Legal, compliance, and regulatory advisory services", tags: ["legal", "compliance", "regulatory"] },
    { name: "Europe Hub", type: "REGION" as const, status: "APPROVED" as const, owner: frank.id, region: "Europe", description: "European market expansion node (pending launch)", tags: ["europe", "mib", "regulation"] },
  ];

  const nodes: any[] = [];
  for (const nd of nodeData) {
    const node = await prisma.node.create({
      data: {
        name: nd.name,
        type: nd.type,
        status: nd.status,
        description: nd.description,
        tags: nd.tags,
        region: nd.region,
        city: nd.city,
        ownerUserId: nd.owner,
        workspaceId: workspace.id,
        level: nd.type === "GLOBAL" ? 1 : nd.type === "REGION" ? 2 : 3,
        entityName: nd.name + " Ltd.",
        contactName: nd.name.split(" ")[0],
        contactEmail: `contact@${nd.name.toLowerCase().replace(/\s+/g, "")}.com`,
      },
    });
    nodes.push(node);
  }
  console.log(`✓ ${nodes.length} nodes created`);

  // ── PROJECTS ───────────────────────────────────────────────────────────
  const projectData = [
    { name: "NexaDEX", stage: "SERIES_A" as const, status: "CURATED" as const, sector: "DeFi", nodeIdx: 1, desc: "Next-gen decentralized exchange with concentrated liquidity and cross-chain aggregation", fundraisingNeed: "$8M Series A", riskTags: ["smart-contract-risk", "competition"] },
    { name: "ChainVault Protocol", stage: "SEED" as const, status: "IN_DEAL_ROOM" as const, sector: "DeFi", nodeIdx: 2, desc: "Institutional-grade custody and yield optimization protocol", fundraisingNeed: "$3M Seed", riskTags: ["custody-risk"] },
    { name: "MetaLayer", stage: "SERIES_A" as const, status: "ACTIVE" as const, sector: "Infrastructure", nodeIdx: 1, desc: "Modular rollup infrastructure enabling app-specific chains", fundraisingNeed: "$12M Series A", riskTags: ["tech-risk", "execution"] },
    { name: "ZKBridge", stage: "SERIES_B" as const, status: "IN_DEAL_ROOM" as const, sector: "Infrastructure", nodeIdx: 3, desc: "Zero-knowledge proof bridge connecting 15+ EVM and non-EVM chains", fundraisingNeed: "$25M Series B", riskTags: ["bridge-risk"] },
    { name: "SocialFi Hub", stage: "SEED" as const, status: "SCREENED" as const, sector: "Social", nodeIdx: 4, desc: "Decentralized social media platform with token-gated communities", fundraisingNeed: "$2M Seed", riskTags: ["adoption-risk", "regulatory"] },
    { name: "DePIN Energy", stage: "SERIES_A" as const, status: "CURATED" as const, sector: "DePIN", nodeIdx: 5, desc: "Decentralized energy grid tokenization and trading", fundraisingNeed: "$10M Series A", riskTags: ["hardware-risk", "regulatory"] },
    { name: "GameChain Studios", stage: "SEED" as const, status: "SUBMITTED" as const, sector: "Gaming", nodeIdx: 1, desc: "AAA blockchain gaming studio building an on-chain MMORPG", fundraisingNeed: "$5M Seed", riskTags: ["execution", "market-timing"] },
    { name: "DataDAO", stage: "SERIES_A" as const, status: "ACTIVE" as const, sector: "Data", nodeIdx: 5, desc: "Decentralized data marketplace with privacy-preserving computation", fundraisingNeed: "$7M Series A", riskTags: ["privacy-tech-risk"] },
    { name: "TokenPayments", stage: "GROWTH" as const, status: "CURATED" as const, sector: "Payments", nodeIdx: 3, desc: "Enterprise crypto payment processing with fiat on/off ramps", fundraisingNeed: "$20M Growth", riskTags: ["regulatory", "compliance"] },
    { name: "AI Agent Protocol", stage: "SEED" as const, status: "IN_DEAL_ROOM" as const, sector: "AI x Crypto", nodeIdx: 2, desc: "Autonomous AI agents for on-chain operations and portfolio management", fundraisingNeed: "$4M Seed", riskTags: ["ai-risk", "novel-tech"] },
  ];

  const projects: any[] = [];
  for (const pd of projectData) {
    const project = await prisma.project.create({
      data: {
        name: pd.name,
        stage: pd.stage,
        status: pd.status,
        sector: pd.sector,
        description: pd.desc,
        fundraisingNeed: pd.fundraisingNeed,
        riskTags: pd.riskTags,
        nodeId: nodes[pd.nodeIdx].id,
        workspaceId: workspace.id,
        contactName: pd.name.split(" ")[0] + " Founder",
        contactEmail: `founder@${pd.name.toLowerCase().replace(/\s+/g, "")}.io`,
        confidentialityLevel: pd.status === "IN_DEAL_ROOM" ? "DEAL_ROOM" : "CERTIFIED_NODE",
        internalScore: Math.round((60 + Math.random() * 35) * 10) / 10,
      },
    });
    projects.push(project);
  }
  console.log(`✓ ${projects.length} projects created`);

  // ── CAPITAL PROFILES ───────────────────────────────────────────────────
  const capitalData = [
    { name: "Paradigm Digital", entity: "Paradigm Digital Fund I", focus: ["DeFi", "Infrastructure"], ticketMin: 5_000_000, ticketMax: 25_000_000, nodeIdx: 2, status: "ACTIVE" as const },
    { name: "Hashkey Capital", entity: "Hashkey Capital III", focus: ["Infrastructure", "DePIN", "AI x Crypto"], ticketMin: 2_000_000, ticketMax: 15_000_000, nodeIdx: 3, status: "ACTIVE" as const },
    { name: "Tiger Crypto", entity: "Tiger Global Crypto", focus: ["DeFi", "Payments", "Social"], ticketMin: 10_000_000, ticketMax: 50_000_000, nodeIdx: 2, status: "QUALIFIED" as const },
    { name: "Animoca Brands", entity: "Animoca Brands Fund", focus: ["Gaming", "Social", "Data"], ticketMin: 1_000_000, ticketMax: 10_000_000, nodeIdx: 3, status: "ACTIVE" as const },
    { name: "Sequoia Crypto", entity: "Sequoia Web3 Fund", focus: ["Infrastructure", "AI x Crypto"], ticketMin: 5_000_000, ticketMax: 30_000_000, nodeIdx: 2, status: "WARM" as const },
    { name: "a16z Crypto", entity: "Andreessen Horowitz Crypto IV", focus: ["DeFi", "Infrastructure", "Social"], ticketMin: 10_000_000, ticketMax: 100_000_000, nodeIdx: 3, status: "PROSPECT" as const },
  ];

  const capitals: any[] = [];
  for (const cd of capitalData) {
    const cap = await prisma.capitalProfile.create({
      data: {
        name: cd.name,
        entity: cd.entity,
        investmentFocus: cd.focus,
        ticketMin: cd.ticketMin,
        ticketMax: cd.ticketMax,
        status: cd.status,
        nodeId: nodes[cd.nodeIdx].id,
        workspaceId: workspace.id,
        contactName: cd.name.split(" ")[0] + " GP",
        contactEmail: `gp@${cd.name.toLowerCase().replace(/\s+/g, "")}.vc`,
        activityScore: Math.round((50 + Math.random() * 50) * 10) / 10,
      },
    });
    capitals.push(cap);
  }
  console.log(`✓ ${capitals.length} capital profiles created`);

  // ── DEALS ──────────────────────────────────────────────────────────────
  const dealData = [
    { title: "NexaDEX Series A", stage: "DD" as const, projectIdx: 0, capitalIdx: 0, leadNodeIdx: 1, desc: "Due diligence phase for NexaDEX $8M raise" },
    { title: "ChainVault Seed Round", stage: "TERM_SHEET" as const, projectIdx: 1, capitalIdx: 1, leadNodeIdx: 2, desc: "Term sheet negotiation for ChainVault $3M seed" },
    { title: "ZKBridge Series B", stage: "MEETING_DONE" as const, projectIdx: 3, capitalIdx: 2, leadNodeIdx: 3, desc: "Post-meeting evaluation for ZKBridge expansion round" },
    { title: "AI Agent Protocol Seed", stage: "INTRO_SENT" as const, projectIdx: 9, capitalIdx: 4, leadNodeIdx: 2, desc: "Introduction made between AI Agent Protocol and Sequoia" },
    { title: "MetaLayer Infrastructure Round", stage: "DD" as const, projectIdx: 2, capitalIdx: 0, leadNodeIdx: 1, desc: "Technical DD for MetaLayer rollup infrastructure" },
    { title: "TokenPayments Growth", stage: "SIGNED" as const, projectIdx: 8, capitalIdx: 2, leadNodeIdx: 3, desc: "Deal signed for TokenPayments $20M growth round" },
  ];

  const deals: any[] = [];
  for (const dd of dealData) {
    const deal = await prisma.deal.create({
      data: {
        title: dd.title,
        stage: dd.stage,
        description: dd.desc,
        projectId: projects[dd.projectIdx].id,
        capitalId: capitals[dd.capitalIdx].id,
        leadNodeId: nodes[dd.leadNodeIdx].id,
        workspaceId: workspace.id,
        confidentialityLevel: "DEAL_ROOM",
      },
    });
    deals.push(deal);

    // Add participants
    await prisma.dealParticipant.create({
      data: { dealId: deal.id, nodeId: nodes[dd.leadNodeIdx].id, role: "LEAD", workspaceId: workspace.id },
    });
    if (dd.leadNodeIdx !== 5) {
      await prisma.dealParticipant.create({
        data: { dealId: deal.id, nodeId: nodes[5].id, role: "RESEARCH", workspaceId: workspace.id },
      });
    }

    // Add milestones
    const milestones = ["Initial Screening", "Deep Dive Call", "Due Diligence", "Term Sheet", "Closing"];
    const stageIdx = ["SOURCED", "MATCHED", "INTRO_SENT", "MEETING_DONE", "DD", "TERM_SHEET", "SIGNED", "FUNDED"].indexOf(dd.stage);
    for (let i = 0; i < milestones.length; i++) {
      await prisma.dealMilestone.create({
        data: {
          dealId: deal.id,
          title: milestones[i],
          workspaceId: workspace.id,
          doneAt: i <= Math.floor(stageIdx / 2) ? new Date(Date.now() - (milestones.length - i) * 86400000 * 3) : undefined,
          dueAt: i > Math.floor(stageIdx / 2) ? new Date(Date.now() + i * 86400000 * 5) : undefined,
        },
      });
    }
  }
  console.log(`✓ ${deals.length} deals created with participants & milestones`);

  // ── TASKS ──────────────────────────────────────────────────────────────
  const taskData = [
    { title: "NexaDEX Technical DD Report", type: "RESEARCH" as const, status: "IN_PROGRESS" as const, projectIdx: 0, dealIdx: 0, ownerNodeIdx: 5, desc: "Complete technical due diligence for NexaDEX DEX architecture" },
    { title: "ChainVault Legal Review", type: "EXECUTION" as const, status: "ASSIGNED" as const, projectIdx: 1, dealIdx: 1, ownerNodeIdx: 6, desc: "Legal review of ChainVault custody framework and licenses" },
    { title: "ZKBridge Security Audit", type: "RESEARCH" as const, status: "SUBMITTED" as const, projectIdx: 3, dealIdx: 2, ownerNodeIdx: 5, desc: "Smart contract security audit for ZKBridge protocol" },
    { title: "AI Agent Protocol Intro Deck", type: "GROWTH" as const, status: "DONE" as const, projectIdx: 9, dealIdx: 3, ownerNodeIdx: 1, desc: "Prepare introduction materials for investor presentation" },
    { title: "MetaLayer Tokenomics Review", type: "RESEARCH" as const, status: "IN_PROGRESS" as const, projectIdx: 2, dealIdx: 4, ownerNodeIdx: 5, desc: "Analyze MetaLayer token design and emission schedule" },
    { title: "TokenPayments Compliance Check", type: "EXECUTION" as const, status: "ACCEPTED" as const, projectIdx: 8, dealIdx: 5, ownerNodeIdx: 6, desc: "Regulatory compliance assessment for payment processing" },
    { title: "DePIN Energy Market Analysis", type: "RESEARCH" as const, status: "DRAFT" as const, projectIdx: 5, ownerNodeIdx: 5, desc: "Market sizing and competitive analysis for DePIN energy sector" },
    { title: "SocialFi Hub User Research", type: "GROWTH" as const, status: "OPEN" as const, projectIdx: 4, ownerNodeIdx: 4, desc: "User interviews and market validation for SocialFi platform" },
    { title: "GameChain Studios Pitch Review", type: "FUNDRAISING" as const, status: "WAITING_REVIEW" as const, projectIdx: 6, ownerNodeIdx: 1, desc: "Review and refine pitch materials for seed raise" },
    { title: "DataDAO Privacy Assessment", type: "RESEARCH" as const, status: "IN_PROGRESS" as const, projectIdx: 7, ownerNodeIdx: 5, desc: "Evaluate privacy-preserving computation approach" },
    { title: "Q1 Settlement Reconciliation", type: "EXECUTION" as const, status: "DONE" as const, ownerNodeIdx: 0, desc: "Complete Q1 2026 settlement cycle reconciliation" },
    { title: "New Node Onboarding — Europe Hub", type: "EXECUTION" as const, status: "IN_PROGRESS" as const, ownerNodeIdx: 0, desc: "Guide Europe Hub through onboarding and compliance" },
  ];

  const tasks: any[] = [];
  for (const td of taskData) {
    const task = await prisma.task.create({
      data: {
        title: td.title,
        type: td.type,
        status: td.status,
        description: td.desc,
        projectId: td.projectIdx !== undefined ? projects[td.projectIdx]?.id : undefined,
        dealId: td.dealIdx !== undefined ? deals[td.dealIdx]?.id : undefined,
        ownerNodeId: nodes[td.ownerNodeIdx].id,
        workspaceId: workspace.id,
        dueAt: new Date(Date.now() + (Math.random() * 30 + 5) * 86400000),
      },
    });
    tasks.push(task);

    await prisma.taskAssignment.create({
      data: { taskId: task.id, nodeId: nodes[td.ownerNodeIdx].id, role: "LEAD" },
    });
  }
  console.log(`✓ ${tasks.length} tasks created with assignments`);

  // ── POB RECORDS ────────────────────────────────────────────────────────
  const pobData = [
    { businessType: "DEAL_SOURCING", nodeIdx: 1, projectIdx: 0, dealIdx: 0, baseValue: 100, score: 85 },
    { businessType: "CAPITAL_INTRO", nodeIdx: 2, projectIdx: 1, dealIdx: 1, baseValue: 120, score: 92 },
    { businessType: "DUE_DILIGENCE", nodeIdx: 5, projectIdx: 0, dealIdx: 0, baseValue: 80, score: 78 },
    { businessType: "DEAL_CLOSING", nodeIdx: 3, projectIdx: 8, dealIdx: 5, baseValue: 200, score: 95 },
    { businessType: "CAPITAL_INTRO", nodeIdx: 3, projectIdx: 3, dealIdx: 2, baseValue: 110, score: 88 },
    { businessType: "RESEARCH", nodeIdx: 5, projectIdx: 2, dealIdx: 4, baseValue: 60, score: 72 },
    { businessType: "GROWTH_SERVICE", nodeIdx: 4, projectIdx: 4, baseValue: 50, score: 65 },
    { businessType: "LEGAL_SERVICE", nodeIdx: 6, projectIdx: 1, dealIdx: 1, baseValue: 70, score: 74 },
    { businessType: "DEAL_SOURCING", nodeIdx: 2, projectIdx: 9, dealIdx: 3, baseValue: 90, score: 82 },
    { businessType: "DUE_DILIGENCE", nodeIdx: 5, projectIdx: 3, dealIdx: 2, baseValue: 85, score: 80 },
  ];

  const pobs: any[] = [];
  for (const pd of pobData) {
    const pob = await prisma.poBRecord.create({
      data: {
        businessType: pd.businessType,
        nodeId: nodes[pd.nodeIdx].id,
        projectId: projects[pd.projectIdx].id,
        dealId: pd.dealIdx !== undefined ? deals[pd.dealIdx]?.id : undefined,
        baseValue: pd.baseValue,
        score: pd.score,
        weight: 1.0,
        qualityMult: 0.8 + Math.random() * 0.4,
        timeMult: 0.9 + Math.random() * 0.2,
        riskDiscount: 0.85 + Math.random() * 0.15,
        status: "APPROVED",
        pobEventStatus: "EFFECTIVE",
        leadNodeId: nodes[pd.nodeIdx].id,
        workspaceId: workspace.id,
      },
    });
    pobs.push(pob);

    await prisma.attribution.create({
      data: { pobId: pob.id, nodeId: nodes[pd.nodeIdx].id, role: "LEAD", shareBps: 7000 },
    });
    const collabIdx = pd.nodeIdx === 5 ? 1 : 5;
    await prisma.attribution.create({
      data: { pobId: pob.id, nodeId: nodes[collabIdx].id, role: "COLLAB", shareBps: 3000 },
    });
  }
  console.log(`✓ ${pobs.length} PoB records created with attributions`);

  // ── EVIDENCE ───────────────────────────────────────────────────────────
  const evidenceData = [
    { type: "REPORT" as const, title: "NexaDEX Technical Audit Report", taskIdx: 0, projectIdx: 0, nodeIdx: 5, reviewStatus: "APPROVED" as const },
    { type: "CONTRACT" as const, title: "ChainVault Term Sheet Draft v2", taskIdx: 1, projectIdx: 1, nodeIdx: 6, reviewStatus: "UNDER_REVIEW" as const },
    { type: "REPORT" as const, title: "ZKBridge Security Assessment", taskIdx: 2, projectIdx: 3, nodeIdx: 5, reviewStatus: "SUBMITTED" as const },
    { type: "SCREENSHOT" as const, title: "AI Agent Protocol Demo Recording", taskIdx: 3, projectIdx: 9, nodeIdx: 1, reviewStatus: "APPROVED" as const },
    { type: "ONCHAIN_TX" as const, title: "TokenPayments Signed Agreement", taskIdx: 5, projectIdx: 8, nodeIdx: 3, reviewStatus: "APPROVED" as const },
    { type: "REPORT" as const, title: "MetaLayer Tokenomics Model v1", taskIdx: 4, projectIdx: 2, nodeIdx: 5, reviewStatus: "DRAFT" as const },
    { type: "LINK" as const, title: "DePIN Energy Whitepaper", projectIdx: 5, nodeIdx: 5, reviewStatus: "SUBMITTED" as const },
    { type: "REPORT" as const, title: "DataDAO Privacy Tech Evaluation", taskIdx: 9, projectIdx: 7, nodeIdx: 5, reviewStatus: "UNDER_REVIEW" as const },
  ];

  for (const ed of evidenceData) {
    await prisma.evidence.create({
      data: {
        type: ed.type,
        title: ed.title,
        summary: `${ed.title} — detailed assessment document`,
        taskId: ed.taskIdx !== undefined ? tasks[ed.taskIdx]?.id : undefined,
        projectId: projects[ed.projectIdx].id,
        nodeId: nodes[ed.nodeIdx].id,
        dealId: ed.taskIdx !== undefined && tasks[ed.taskIdx]?.dealId ? tasks[ed.taskIdx].dealId : undefined,
        reviewStatus: ed.reviewStatus,
        workspaceId: workspace.id,
      },
    });
  }
  console.log(`✓ ${evidenceData.length} evidence records created`);

  // ── MATCHES ────────────────────────────────────────────────────────────
  const matchPairs = [
    { projectIdx: 0, capitalIdx: 1, score: 87, status: "INTEREST_EXPRESSED" as const },
    { projectIdx: 0, capitalIdx: 4, score: 72, status: "GENERATED" as const },
    { projectIdx: 2, capitalIdx: 1, score: 91, status: "CONVERTED_TO_DEAL" as const },
    { projectIdx: 4, capitalIdx: 3, score: 68, status: "GENERATED" as const },
    { projectIdx: 5, capitalIdx: 0, score: 45, status: "DECLINED" as const },
    { projectIdx: 7, capitalIdx: 4, score: 82, status: "INTEREST_EXPRESSED" as const },
    { projectIdx: 9, capitalIdx: 1, score: 78, status: "GENERATED" as const },
    { projectIdx: 6, capitalIdx: 3, score: 74, status: "GENERATED" as const },
    { projectIdx: 1, capitalIdx: 0, score: 83, status: "CONVERTED_TO_DEAL" as const },
    { projectIdx: 3, capitalIdx: 2, score: 89, status: "CONVERTED_TO_DEAL" as const },
  ];

  for (const mp of matchPairs) {
    await prisma.match.create({
      data: {
        projectId: projects[mp.projectIdx].id,
        capitalProfileId: capitals[mp.capitalIdx].id,
        capitalNodeId: capitals[mp.capitalIdx].nodeId!,
        score: mp.score,
        sectorScore: 20 + Math.random() * 30,
        stageScore: 15 + Math.random() * 25,
        ticketScore: 10 + Math.random() * 20,
        jurisdictionScore: 5 + Math.random() * 15,
        status: mp.status,
        convertedDealId: mp.status === "CONVERTED_TO_DEAL" ? deals[matchPairs.indexOf(mp) % deals.length]?.id : undefined,
        expiresAt: new Date(Date.now() + 30 * 86400000),
      },
    });
  }
  console.log(`✓ ${matchPairs.length} matches created`);

  // ── SETTLEMENT ─────────────────────────────────────────────────────────
  const cycle = await prisma.settlementCycle.create({
    data: {
      kind: "MONTH",
      status: "FINALIZED",
      startAt: new Date("2026-03-01"),
      endAt: new Date("2026-03-31"),
      pool: 500000,
      workspaceId: workspace.id,
      reconciledAt: new Date("2026-04-02"),
      exportedAt: new Date("2026-04-05"),
    },
  });

  const activeCycle = await prisma.settlementCycle.create({
    data: {
      kind: "MONTH",
      status: "DRAFT",
      startAt: new Date("2026-04-01"),
      endAt: new Date("2026-04-30"),
      pool: 600000,
      workspaceId: workspace.id,
    },
  });

  const totalScore = pobs.reduce((sum, p) => sum + p.score, 0);
  for (let i = 0; i < Math.min(6, nodes.length); i++) {
    const nodePoB = pobs.filter((p: any) => p.nodeId === nodes[i].id);
    const nodeScore = nodePoB.reduce((sum: number, p: any) => sum + p.score, 0);
    if (nodeScore > 0) {
      await prisma.settlementLine.create({
        data: {
          cycleId: cycle.id,
          nodeId: nodes[i].id,
          scoreTotal: nodeScore,
          allocation: Math.round((nodeScore / totalScore) * 500000 * 100) / 100,
          pobCount: nodePoB.length,
        },
      });
    }
  }
  console.log(`✓ 2 settlement cycles created (1 finalized, 1 active)`);

  // ── REPUTATION ─────────────────────────────────────────────────────────
  const tiers: ("BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND")[] = ["DIAMOND", "PLATINUM", "GOLD", "GOLD", "SILVER", "GOLD", "SILVER", "BRONZE"];
  const scores = [95, 88, 78, 75, 62, 80, 58, 35];
  for (let i = 0; i < nodes.length; i++) {
    await prisma.reputationScore.create({
      data: {
        nodeId: nodes[i].id,
        score: scores[i],
        tier: tiers[i],
        components: {
          dealExecution: 15 + Math.random() * 25,
          evidenceQuality: 10 + Math.random() * 30,
          timelinessScore: 10 + Math.random() * 20,
          networkContribution: 5 + Math.random() * 15,
          peerReviewScore: 5 + Math.random() * 10,
        },
        calculatedAt: new Date(),
      },
    });

    const badgeTypes = ["EARLY_ADOPTER", "TOP_SOURCER", "RESEARCH_EXPERT", "DEAL_CLOSER", "COMPLIANCE_STAR"];
    const numBadges = Math.min(Math.floor(scores[i] / 25) + 1, badgeTypes.length);
    for (let b = 0; b < numBadges; b++) {
      await prisma.reputationBadge.create({
        data: { nodeId: nodes[i].id, badgeType: badgeTypes[b] },
      });
    }
  }
  console.log(`✓ ${nodes.length} reputation scores + badges created`);

  // ── APPLICATIONS ───────────────────────────────────────────────────────
  const appData = [
    { name: "Tokyo Crypto Fund", org: "TCF Management", status: "PENDING" as const, nodeType: "CITY", contact: "contact@tcf.jp" },
    { name: "Berlin DeFi Labs", org: "BDL GmbH", status: "REVIEWING" as const, nodeType: "CITY", contact: "apply@bdl.de" },
    { name: "MENA Investment Group", org: "MIG Holdings", status: "PENDING" as const, nodeType: "REGION", contact: "ir@mig.ae" },
    { name: "LatAm Growth Partners", org: "LGP Ventures", status: "APPROVED" as const, nodeType: "REGION", contact: "info@lgp.com" },
  ];

  for (const ad of appData) {
    await prisma.application.create({
      data: {
        applicantName: ad.name,
        organization: ad.org,
        status: ad.status,
        nodeType: ad.nodeType,
        contact: ad.contact,
        resources: "Capital deployment, local market access, deal sourcing",
        lookingFor: "Access to WCN deal flow and network services",
        whyWcn: "Strong alignment with WCN's vision for decentralized capital orchestration",
        workspaceId: workspace.id,
      },
    });
  }
  console.log(`✓ ${appData.length} applications created`);

  // ── RISK FLAGS ─────────────────────────────────────────────────────────
  const riskData = [
    { entityType: "PROJECT", entityId: projects[0].id, severity: "MEDIUM", reason: "Smart contract audit pending — NexaDEX V2 not yet audited" },
    { entityType: "PROJECT", entityId: projects[3].id, severity: "HIGH", reason: "Bridge protocol — elevated cross-chain risk" },
    { entityType: "DEAL", entityId: deals[2].id, severity: "LOW", reason: "Large raise size — require additional LP due diligence" },
    { entityType: "NODE", entityId: nodes[7].id, severity: "MEDIUM", reason: "Europe Hub pending regulatory approval in Germany" },
    { entityType: "PROJECT", entityId: projects[4].id, severity: "LOW", reason: "SocialFi regulatory uncertainty in multiple jurisdictions" },
  ];

  for (const rd of riskData) {
    await prisma.riskFlag.create({
      data: {
        entityType: rd.entityType,
        entityId: rd.entityId,
        severity: rd.severity,
        reason: rd.reason,
        raisedById: frank.id,
        workspaceId: workspace.id,
      },
    });
  }
  console.log(`✓ ${riskData.length} risk flags created`);

  // ── NOTIFICATIONS ──────────────────────────────────────────────────────
  const notifData = [
    { type: "DEAL_STAGE_CHANGE" as const, title: "Deal Advanced: ChainVault Seed", body: "ChainVault Seed Round moved to TERM_SHEET stage" },
    { type: "TASK_ASSIGNED" as const, title: "New Task: NexaDEX Technical DD", body: "You have been assigned to complete technical due diligence" },
    { type: "APPROVAL_PENDING" as const, title: "Approval Needed: Europe Hub", body: "Europe Hub node application requires your review" },
    { type: "SETTLEMENT_CLOSING" as const, title: "March Settlement Finalized", body: "March 2026 settlement cycle has been finalized. Check your allocation." },
    { type: "EVIDENCE_SUBMITTED" as const, title: "New Evidence: ZKBridge Audit", body: "ZKBridge Security Assessment has been submitted for review" },
    { type: "DISPUTE_OPENED" as const, title: "Attribution Dispute Filed", body: "A dispute has been opened on PoB attribution for DePIN Energy" },
  ];

  for (const nd of notifData) {
    await prisma.notification.create({
      data: {
        type: nd.type,
        userId: ADMIN_ID,
        title: nd.title,
        body: nd.body,
        workspaceId: workspace.id,
      },
    });
  }
  console.log(`✓ ${notifData.length} notifications created`);

  // ── CAMPAIGNS ──────────────────────────────────────────────────────────
  const campaign = await prisma.campaign.create({
    data: {
      title: "WCN Asia Launch Campaign",
      description: "Multi-channel campaign to onboard 50 new APAC nodes in Q2 2026",
      status: "ACTIVE",
      budget: 100000,
      startAt: new Date("2026-04-01"),
      endAt: new Date("2026-06-30"),
      createdById: ADMIN_ID,
    },
  });

  await prisma.campaignChannel.create({
    data: { campaignId: campaign.id, nodeId: nodes[1].id, channel: "Events & Conferences", status: "ACTIVE" },
  });
  await prisma.campaignChannel.create({
    data: { campaignId: campaign.id, nodeId: nodes[4].id, channel: "Online Webinars", status: "ACTIVE" },
  });

  for (let w = 1; w <= 4; w++) {
    await prisma.campaignMetric.create({
      data: {
        campaignId: campaign.id,
        metricType: "NEW_NODES",
        value: Math.floor(5 + Math.random() * 10),
        recordedAt: new Date(Date.now() - (4 - w) * 7 * 86400000),
      },
    });
    await prisma.campaignMetric.create({
      data: {
        campaignId: campaign.id,
        metricType: "APPLICATIONS",
        value: Math.floor(10 + Math.random() * 20),
        recordedAt: new Date(Date.now() - (4 - w) * 7 * 86400000),
      },
    });
  }
  console.log(`✓ 1 campaign with channels and metrics`);

  // ── GOVERNANCE ─────────────────────────────────────────────────────────
  const proposal1 = await prisma.proposal.create({
    data: {
      title: "WCN Fee Structure Update — Q2 2026",
      description: "Proposal to adjust network fee split from 80/20 to 75/25 (Node/Network) starting Q2 2026",
      type: "GOVERNANCE",
      status: "ACTIVE",
      options: JSON.parse('[{"id":"yes","label":"Approve 75/25 split"},{"id":"no","label":"Keep current 80/20"},{"id":"alt","label":"Propose 70/30 split"}]'),
      quorum: 5,
      deadline: new Date(Date.now() + 14 * 86400000),
      createdById: ADMIN_ID,
    },
  });

  const proposal2 = await prisma.proposal.create({
    data: {
      title: "Add MENA Region as Official Hub",
      description: "Proposal to establish MENA Investment Group as an official regional hub",
      type: "MEMBERSHIP",
      status: "PASSED",
      options: JSON.parse('[{"id":"yes","label":"Approve MENA Hub"},{"id":"no","label":"Reject"}]'),
      quorum: 3,
      deadline: new Date(Date.now() - 7 * 86400000),
      createdById: ADMIN_ID,
      executedAt: new Date(Date.now() - 2 * 86400000),
    },
  });

  const voters = [ADMIN_ID, alice.id, bob.id, carol.id, david.id];
  for (const voterId of voters.slice(0, 3)) {
    await prisma.vote.create({
      data: { proposalId: proposal1.id, voterId, option: "yes", weight: 1 },
    });
  }
  for (const voterId of voters) {
    await prisma.vote.create({
      data: { proposalId: proposal2.id, voterId, option: "yes", weight: 1 },
    });
  }
  console.log(`✓ 2 proposals with votes`);

  // ── AUDIT LOGS ─────────────────────────────────────────────────────────
  const auditActions = [
    { action: "DEAL_CREATED", targetType: "DEAL", targetId: deals[0].id },
    { action: "DEAL_STAGE_CHANGED", targetType: "DEAL", targetId: deals[1].id, metadata: { from: "DD", to: "TERM_SHEET" } },
    { action: "POB_APPROVED", targetType: "POB", targetId: pobs[0].id },
    { action: "NODE_ONBOARDED", targetType: "NODE", targetId: nodes[1].id },
    { action: "SETTLEMENT_FINALIZED", targetType: "SETTLEMENT", targetId: cycle.id },
    { action: "USER_LOGIN", targetType: "USER", targetId: ADMIN_ID },
    { action: "EVIDENCE_SUBMITTED", targetType: "EVIDENCE", targetId: "evidence-1" },
    { action: "MATCH_GENERATED", targetType: "MATCH", targetId: "batch-1", metadata: { count: 10 } },
    { action: "RISK_FLAG_RAISED", targetType: "PROJECT", targetId: projects[3].id },
    { action: "APPLICATION_REVIEWED", targetType: "APPLICATION", targetId: "app-1" },
  ];

  for (const al of auditActions) {
    await prisma.auditLog.create({
      data: {
        actorUserId: ADMIN_ID,
        action: al.action,
        targetType: al.targetType,
        targetId: al.targetId,
        metadata: al.metadata ?? undefined,
        workspaceId: workspace.id,
      },
    });
  }
  console.log(`✓ ${auditActions.length} audit log entries`);

  // ── DISPUTES ───────────────────────────────────────────────────────────
  await prisma.dispute.create({
    data: {
      targetType: "POB",
      targetId: pobs[6].id,
      pobId: pobs[6].id,
      reason: "Attribution share does not accurately reflect contribution to DePIN Energy growth services",
      status: "OPEN",
      windowEndsAt: new Date(Date.now() + 7 * 86400000),
      workspaceId: workspace.id,
    },
  });
  console.log(`✓ 1 dispute created`);

  // ── AGENTS ─────────────────────────────────────────────────────────────
  const agentData = [
    { name: "WCN Research Agent", type: "RESEARCH" as const, ownerNodeIdx: 5 },
    { name: "WCN Deal Agent", type: "DEAL" as const, ownerNodeIdx: 0 },
    { name: "WCN Growth Agent", type: "GROWTH" as const, ownerNodeIdx: 4 },
    { name: "WCN Execution Agent", type: "EXECUTION" as const, ownerNodeIdx: 0 },
  ];

  const agents: any[] = [];
  for (const ad of agentData) {
    const agent = await prisma.agent.create({
      data: {
        name: ad.name,
        type: ad.type,
        status: "ACTIVE",
        ownerNodeId: nodes[ad.ownerNodeIdx].id,
        workspaceId: workspace.id,
      },
    });
    agents.push(agent);

    await prisma.agentPermission.create({
      data: { agentId: agent.id, scope: ad.type.toLowerCase(), canWrite: true, auditLevel: 2 },
    });
  }

  // Agent runs
  for (let i = 0; i < 3; i++) {
    await prisma.agentRun.create({
      data: {
        agentId: agents[0].id,
        taskId: tasks[i]?.id,
        status: "SUCCESS",
        inputs: { projectId: projects[i].id, type: "deep_analysis" },
        outputs: { summary: `Research analysis for ${projects[i].name}`, confidence: 0.85 + Math.random() * 0.1 },
        outputType: "REPORT",
        reviewStatus: i === 0 ? "APPROVED" : "PENDING",
        reviewedById: i === 0 ? ADMIN_ID : undefined,
        tokenCount: 2000 + Math.floor(Math.random() * 3000),
        executionTimeMs: 5000 + Math.floor(Math.random() * 10000),
        modelId: "gpt-4o",
        cost: 0.02 + Math.random() * 0.05,
        workspaceId: workspace.id,
      },
    });
  }
  console.log(`✓ ${agents.length} agents with permissions and ${3} runs`);

  console.log("\n✅ Seed complete! WCN demo data populated.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

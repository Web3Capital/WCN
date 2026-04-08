export const docs = [
  {
    slug: "introduction",
    title: "01 Introduction",
    description: "What WCN is, what it is not, and why it matters.",
    content: `
## What is WCN

WCN is a global coordination infrastructure for Web3 and AI.
It aligns capital, execution, proof, and settlement across a distributed network.

## What WCN is not

- Not a trading venue
- Not a social platform
- Not a narrative-only token story
- Not a passive directory of contacts

## Core principle

Real business is the only durable source of value.
`
  },
  {
    slug: "problem",
    title: "02 Problem",
    description: "The structural gap WCN is built to solve.",
    content: `
## Industry breakdown

Today’s Web3 market suffers from three major bottlenecks:

- Capital and execution are disconnected
- Contribution is difficult to verify
- Allocation is often relationship-driven, not system-driven

## Result

The ecosystem remains fragmented, slow, and difficult to scale.
`
  },
  {
    slug: "solution",
    title: "03 Solution",
    description: "The operating layer for capital, nodes, and execution.",
    content: `
## WCN solution stack

- Global Node Network
- Proof of Business (PoB)
- Settlement Engine

## Logic

Resource → Execution → Proof → Value
`
  },
  {
    slug: "mechanism",
    title: "04 Mechanism",
    description: "How the business loop actually works.",
    content: `
## Minimal business loop

Node → Deal → Task → Proof → Settlement

## Meaning

Every opportunity becomes a workflow.
Every workflow becomes proof.
Every proof becomes a basis for settlement.
`
  },
  {
    slug: "pob",
    title: "05 Proof of Business",
    description: "The verification layer of the network.",
    content: `
## What PoB records

- What was done
- Who contributed
- What outcome was created

## Why it matters

Without verification, there is no reliable allocation.
`
  },
  {
    slug: "settlement",
    title: "06 Settlement",
    description: "How value is allocated across participants.",
    content: `
## Settlement logic

Allocation is based on verified contribution rather than status, noise, or proximity.

## Outcomes

- Fairer distribution
- More transparent logic
- Stronger incentive alignment
`
  }
];

export function getDoc(slug: string) {
  return docs.find((doc) => doc.slug === slug) ?? docs[0];
}

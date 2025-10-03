import type { Mention } from "../types.js";

const samples = [
  { t: "I’m so frustrated, the product keeps crashing after the update.", score: -0.7 },
  { t: "Decent experience, but support took a while to respond.", score: -0.1 },
  { t: "Absolutely love this! Best purchase this year.", score: 0.8 },
  { t: "This feature is confusing and the docs are unclear.", score: -0.4 },
  { t: "Works as expected.", score: 0.1 }
];

export function generateMockMention(): Mention {
  const s = samples[Math.floor(Math.random() * samples.length)];
  const user = ["alice","bob","carol","dave","eve"][Math.floor(Math.random()*5)];
  return {
    timestamp: Date.now(),
    user,
    content: s.t,
    source: "mock",
  };
}

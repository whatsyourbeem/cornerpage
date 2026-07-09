import type { MiniHomepageContent } from "@/lib/content-types";
import cafeMillmuldabang from "./cafe-millmuldabang.json";
import dentalSuji from "./dental-suji.json";
import funeralSambo from "./funeral-sambo.json";
import gymThorgym from "./gym-thorgym.json";
import nailOfyoon from "./nail-ofyoon.json";
import studycafeIvy from "./studycafe-ivy.json";
import showcaseAllBlocks from "./showcase-all-blocks.json";

export const FIXTURES = {
  "showcase-all-blocks": showcaseAllBlocks,
  "cafe-millmuldabang": cafeMillmuldabang,
  "dental-suji": dentalSuji,
  "funeral-sambo": funeralSambo,
  "gym-thorgym": gymThorgym,
  "nail-ofyoon": nailOfyoon,
  "studycafe-ivy": studycafeIvy,
} as unknown as Record<string, MiniHomepageContent>;

export type FixtureSlug = keyof typeof FIXTURES;

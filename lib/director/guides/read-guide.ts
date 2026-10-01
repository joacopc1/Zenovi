import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { DIRECTOR_GUIDES } from "./index";

/** El texto de una guía registrada. Un slug que no está en el índice no lee ningún archivo. */
export async function readDirectorGuide(slug: string) {
  const guide = DIRECTOR_GUIDES.find((candidate) => candidate.slug === slug);
  if (!guide) return null;
  return readFile(path.join(process.cwd(), "lib/director/guides", `${guide.slug}.md`), "utf8");
}

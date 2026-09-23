import "server-only";

import type { ContentFormat, ContentSource, ContentStatus } from "@/lib/production/content";
import { isContentFormat, isContentSource, isContentStatus } from "@/lib/production/content";
import { createClient } from "@/lib/supabase/server";

export type ContentItem = {
  id: string;
  title: string;
  contentType: string;
  format: ContentFormat;
  status: ContentStatus;
  targetDate: string | null;
  referenceUrl: string;
  hook: string;
  development: string;
  cta: string;
  source: ContentSource;
  linkedMediaId: string | null;
};

type ContentItemRow = {
  id: string;
  title: string;
  content_type: string;
  format: string;
  status: string;
  target_date: string | null;
  reference_url: string;
  hook: string;
  development: string;
  cta: string;
  source: string;
  linked_media_id: string | null;
};

export async function getContentItems(workspaceId: string): Promise<ContentItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_items")
    .select(
      "id, title, content_type, format, status, target_date, reference_url, hook, development, cta, source, linked_media_id",
    )
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("No pudimos cargar la producción.");

  return ((data ?? []) as ContentItemRow[]).map(toContentItem);
}

function toContentItem(row: ContentItemRow): ContentItem {
  return {
    id: row.id,
    title: row.title,
    contentType: row.content_type,
    format: isContentFormat(row.format) ? row.format : "reel",
    status: isContentStatus(row.status) ? row.status : "idea",
    targetDate: row.target_date,
    referenceUrl: row.reference_url ?? "",
    hook: row.hook,
    development: row.development,
    cta: row.cta,
    source: isContentSource(row.source) ? row.source : "manual",
    linkedMediaId: row.linked_media_id,
  };
}

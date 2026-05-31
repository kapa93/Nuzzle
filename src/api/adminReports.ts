import { supabase } from '@/lib/supabase';
import type { ReportStatus } from '@/types';

export type AdminReportContentType = 'POST' | 'COMMENT';

export interface AdminReport {
  id: string;
  reportable_type: AdminReportContentType;
  reportable_id: string;
  reason: string | null;
  status: ReportStatus;
  created_at: string;
  reporter: {
    id: string;
    name: string;
    profile_image_url: string | null;
  } | null;
  // Resolved content — only one will be populated
  post: {
    id: string;
    content_text: string;
    title: string | null;
    breed: string | null;
    place_id: string | null;
    author: { id: string; name: string } | null;
  } | null;
  comment: {
    id: string;
    content_text: string;
    post_id: string;
    author: { id: string; name: string } | null;
    post_title: string | null;
  } | null;
}

export async function fetchAdminReports(): Promise<AdminReport[]> {
  const { data, error } = await supabase
    .from('reports')
    .select(`
      id,
      reportable_type,
      reportable_id,
      reason,
      status,
      created_at,
      reporter:reporter_id (
        id,
        name,
        profile_image_url
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const reports = data ?? [];

  // Resolve post and comment content in parallel
  const postIds = reports
    .filter((r) => r.reportable_type === 'POST')
    .map((r) => r.reportable_id);
  const commentIds = reports
    .filter((r) => r.reportable_type === 'COMMENT')
    .map((r) => r.reportable_id);

  const [postsResult, commentsResult] = await Promise.all([
    postIds.length > 0
      ? supabase
          .from('posts')
          .select('id, content_text, title, breed, place_id, author:author_id (id, name)')
          .in('id', postIds)
      : { data: [], error: null },
    commentIds.length > 0
      ? supabase
          .from('comments')
          .select(`
            id,
            content_text,
            post_id,
            author:author_id (id, name),
            post:post_id (title, content_text)
          `)
          .in('id', commentIds)
      : { data: [], error: null },
  ]);

  if (postsResult.error) throw postsResult.error;
  if (commentsResult.error) throw commentsResult.error;

  const postsById = Object.fromEntries((postsResult.data ?? []).map((p) => [p.id, p]));
  const commentsById = Object.fromEntries((commentsResult.data ?? []).map((c) => [c.id, c]));

  return reports.map((r) => {
    if (r.reportable_type === 'POST') {
      const p = postsById[r.reportable_id] ?? null;
      return {
        ...r,
        reporter: Array.isArray(r.reporter) ? r.reporter[0] ?? null : r.reporter,
        post: p
          ? {
              id: p.id,
              content_text: p.content_text,
              title: p.title,
              breed: p.breed,
              place_id: p.place_id,
              author: Array.isArray(p.author) ? p.author[0] ?? null : p.author,
            }
          : null,
        comment: null,
      };
    } else {
      const c = commentsById[r.reportable_id] ?? null;
      const postRef = c ? (Array.isArray(c.post) ? c.post[0] : c.post) : null;
      return {
        ...r,
        reporter: Array.isArray(r.reporter) ? r.reporter[0] ?? null : r.reporter,
        post: null,
        comment: c
          ? {
              id: c.id,
              content_text: c.content_text,
              post_id: c.post_id,
              author: Array.isArray(c.author) ? c.author[0] ?? null : c.author,
              post_title: postRef?.title ?? postRef?.content_text?.slice(0, 60) ?? null,
            }
          : null,
      };
    }
  });
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .update({ status })
    .eq('id', reportId);
  if (error) throw error;
}

export async function deleteReportedContent(
  reportId: string,
  contentType: AdminReportContentType,
  contentId: string,
): Promise<void> {
  if (contentType === 'POST') {
    const { error } = await supabase.from('posts').delete().eq('id', contentId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('comments').delete().eq('id', contentId);
    if (error) throw error;
  }

  await updateReportStatus(reportId, 'reviewed');
}

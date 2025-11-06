/**
 * Insights Service
 * 
 * TODO: Implement các hàm sau:
 * - getSummary: Lấy tổng quan insights cho page
 * - getTopPosts: Lấy top posts theo score
 * - getKeywordSeeds: Lấy keywords từ captions và comments
 */

export async function getSummary(pageId: string): Promise<any> {
  // TODO: Implement
  // - Gọi Graph API thông qua graph.client.ts
  // - Đọc PAGE access token từ DB theo pageId
  // - Trả về: page_views_by_country, page_fans_country, page_impressions, page_engaged_users
  throw new Error("Not implemented yet");
}

export async function getTopPosts(
  pageId: string,
  limit: number,
  topK: number
): Promise<any[]> {
  // TODO: Implement
  // - Tính score: 0.3*impressions + 0.5*engaged + 0.2*video_views
  // - Trả về top posts theo score
  throw new Error("Not implemented yet");
}

export async function getKeywordSeeds(
  pageId: string,
  limitPosts: number,
  topK: number
): Promise<any[]> {
  // TODO: Implement
  // - Tokenize Vietnamese từ caption + comments
  // - Trả về top keywords
  throw new Error("Not implemented yet");
}


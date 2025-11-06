/**
 * DTO (Data Transfer Objects) cho Insights API
 * Map dữ liệu raw từ Graph API -> DTO trả về client
 */

export function toSummaryDto(data: any): any {
  // TODO: Implement mapping
  // Trả về: page_views_by_country, page_fans_country, page_impressions, page_engaged_users
  return data;
}

export function toTopPostsDto(items: any[]): any {
  // TODO: Implement mapping
  // Map top posts với score
  return { items };
}

export function toKeywordItems(items: any[]): any {
  // TODO: Implement mapping
  // Map keywords từ tokenization
  return { items };
}


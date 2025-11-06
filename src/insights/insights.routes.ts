import { Router, Request, Response } from "express";

import { z } from "zod";

import { requireAuth } from "../middleware/requireAuth";          // middleware JWT của bạn

import { requireRole } from "../middleware/requireRole";          // RBAC: Admin/Editor/Viewer

import * as Svc from "./insights.service";                        // bạn sẽ tạo file này

import { toKeywordItems, toTopPostsDto, toSummaryDto } from "./dto"; // bạn sẽ tạo file này



const router = Router();



/** Validate query với zod */

const SummaryQuery = z.object({

  pageId: z.string().min(1, "pageId is required"),

});



const TopPostsQuery = z.object({

  pageId: z.string().min(1),

  limit: z.coerce.number().int().min(1).max(100).default(25),

  topK: z.coerce.number().int().min(1).max(50).default(10),

});



const KeywordsQuery = z.object({

  pageId: z.string().min(1),

  limitPosts: z.coerce.number().int().min(1).max(100).default(20),

  topK: z.coerce.number().int().min(1).max(100).default(20),

});



/**

 * GET /api/insights/summary?pageId=...

 * Trả: page_views_by_country, page_fans_country, page_impressions, page_engaged_users

 */

router.get(

  "/summary",

  requireAuth,

  requireRole(["Viewer", "Editor", "Admin"]),

  async (req: Request, res: Response) => {

    const q = SummaryQuery.parse(req.query);

    const data = await Svc.getSummary(q.pageId);

    return res.json(toSummaryDto(data));

  }

);



/**

 * GET /api/insights/top-posts?pageId=...&limit=25&topK=10

 * Trả: danh sách top post theo score (0.3*impressions + 0.5*engaged + 0.2*video_views)

 */

router.get(

  "/top-posts",

  requireAuth,

  requireRole(["Viewer", "Editor", "Admin"]),

  async (req: Request, res: Response) => {

    const q = TopPostsQuery.parse(req.query);

    const items = await Svc.getTopPosts(q.pageId, q.limit, q.topK);

    return res.json(toTopPostsDto(items));

  }

);



/**

 * GET /api/insights/keywords?pageId=...&limitPosts=20&topK=20

 * Trả: các từ khóa hạt giống từ caption + comments

 */

router.get(

  "/keywords",

  requireAuth,

  requireRole(["Viewer", "Editor", "Admin"]),

  async (req: Request, res: Response) => {

    const q = KeywordsQuery.parse(req.query);

    const items = await Svc.getKeywordSeeds(q.pageId, q.limitPosts, q.topK);

    return res.json(toKeywordItems(items));

  }

);



export default router;



/**

 * GỢI Ý wiring:

 *  - Trong src/server.ts (hoặc app.ts):

 *      import insightsRoutes from "./insights/insights.routes";

 *      app.use("/api/insights", insightsRoutes);

 *

 *  - Bạn cần tự tạo:

 *      - src/insights/insights.service.ts:

 *          + gọi Graph API thông qua graph.client.ts

 *          + đọc PAGE access token từ DB theo pageId

 *          + tính score top-posts, gom metrics country, tokenize TV cho keywords

 *      - src/insights/graph.client.ts: HTTP client + Redis cache (TTL = FB_CACHE_TTL_SEC)

 *      - src/insights/dto.ts: map dữ liệu raw -> DTO trả về client

 *      - middleware requireAuth/requireRole nếu repo chưa có

 */


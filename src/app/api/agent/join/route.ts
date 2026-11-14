import { handleEnrollment } from "@/lib/mcp";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return handleEnrollment(request);
}

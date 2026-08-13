import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, withErrorHandling } from "@/lib/api";
import { requireAuth, isAdmin } from "@/lib/auth";

export const PATCH = withErrorHandling(async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await requireAuth();
  if (!isAdmin(user)) {
    return apiError("Forbidden", 403);
  }

  const { id } = await params;

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) {
    return apiError("Report not found", 404);
  }

  const updated = await prisma.report.update({
    where: { id },
    data: { status: "RESOLVED" },
  });

  return NextResponse.json(updated);
});

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { AdminReportsList } from "@/components/AdminReportsList";
import { VipManagement } from "@/components/VipManagement";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const reports = await prisma.report.findMany({
    where: { status: "PENDING" },
    include: {
      reporter: { select: { id: true, username: true } },
      post: {
        select: {
          id: true,
          title: true,
          body: true,
          author: { select: { username: true } },
        },
      },
      reply: {
        select: {
          id: true,
          body: true,
          author: { select: { username: true } },
        },
      },
      reportedUser: { select: { id: true, username: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Reported content</h1>
        <p className="text-gray-400">Pending reports awaiting moderation</p>
      </div>
      <AdminReportsList
        reports={reports.map((report) => ({
          ...report,
          createdAt: report.createdAt.toISOString(),
        }))}
      />

      <div className="mt-8">
        <VipManagement />
      </div>
    </div>
  );
}

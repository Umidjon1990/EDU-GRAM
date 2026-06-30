import { GroupMemberRole } from "@prisma/client";

import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { assignmentDictionary } from "@/i18n/locales/uz-Latn-UZ";

type RouteContext = {
  params: Promise<{
    assignmentId: string;
  }>;
};

const t = assignmentDictionary;

export async function GET(_request: Request, context: RouteContext) {
  const user = await requirePermission("assignment:create:owned_group");
  const { assignmentId } = await context.params;
  const assignment = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      organizationId: user.organizationId,
      teacherId: user.id,
    },
    include: {
      group: {
        select: {
          name: true,
          members: {
            where: { role: GroupMemberRole.STUDENT },
            orderBy: { user: { fullName: "asc" } },
            select: { user: { select: { id: true, fullName: true } } },
          },
        },
      },
      submissions: {
        include: {
          student: { select: { id: true, fullName: true } },
          attachments: {
            include: {
              file: { select: { storageDeletedAt: true } },
            },
          },
        },
      },
    },
  });

  if (!assignment) {
    return new Response("Topilmadi", { status: 404 });
  }

  const submitted = new Map(
    assignment.submissions.map((submission) => [submission.student.id, submission]),
  );
  const lines = [
    "Modern Edu",
    `${t.title}: ${assignment.title}`,
    `Guruh: ${assignment.group.name}`,
    `${t.controlList}`,
    "",
    `${t.studentName} | ${t.submissionStatus} | ${t.submittedAt} | ${t.telegramStatus}`,
    ...assignment.group.members.map((member, index) => {
      const submission = submitted.get(member.user.id);
      const sentToTelegram = submission?.attachments.some(
        (attachment) => attachment.file.storageDeletedAt,
      );

      return [
        `${index + 1}. ${member.user.fullName}`,
        submission ? t.submittedStatus : t.missingStatus,
        submission ? formatUzDateTime(submission.submittedAt) : "-",
        submission ? (sentToTelegram ? t.sentToTelegram : t.notSentToTelegram) : "-",
      ].join(" | ");
    }),
  ];
  const pdf = createSimplePdf(lines);
  const filename = encodeURIComponent(`${assignment.title}-hisobot.pdf`);

  return new Response(pdf, {
    headers: {
      "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function createSimplePdf(lines: string[]) {
  const pageLineLimit = 38;
  const pages = chunk(lines, pageLineLimit);
  const objects: string[] = [];
  const pageObjectIds: number[] = [];

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("PAGES_PLACEHOLDER");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  for (const pageLines of pages) {
    const content = [
      "BT",
      "/F1 11 Tf",
      "50 790 Td",
      "16 TL",
      ...pageLines.map((line) => `(${escapePdfText(line)}) Tj T*`),
      "ET",
    ].join("\n");
    const contentId = objects.length + 1;
    objects.push(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`);
    const pageId = objects.length + 1;
    pageObjectIds.push(pageId);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
  }

  objects[1] =
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`;

  const offsets: number[] = [];
  let body = "%PDF-1.4\n";
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(body));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n`;
  body += "0000000000 65535 f \n";
  body += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(body, "utf8");
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks.length > 0 ? chunks : [[]];
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function formatUzDateTime(date: Date) {
  return new Intl.DateTimeFormat("uz-Latn-UZ", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
    timeZone: "Asia/Tashkent",
    year: "numeric",
  }).format(date);
}

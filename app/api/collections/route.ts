import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    const data = collections.map((c: any) => ({
      id: Number(c.id),
      name: c.name,
      isDefault: c.isDefault,
      count: c._count.items,
    }));

    return NextResponse.json({ collections: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "服务器内部错误" },
      { status: 500 }
    );
  }
}

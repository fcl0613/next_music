import { NextRequest, NextResponse } from "next/server";
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, coverUrl } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "歌单名称不能为空" },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: "歌单名称不能超过 100 个字符" },
        { status: 400 }
      );
    }

    // 检查名称是否重复
    const existing = await prisma.collection.findFirst({
      where: { name: name.trim() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "歌单名称已存在" },
        { status: 409 }
      );
    }

    const collection = await prisma.collection.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        coverUrl: coverUrl?.trim() || null,
      },
    });

    return NextResponse.json({
      collection: {
        id: Number(collection.id),
        name: collection.name,
        description: collection.description,
        coverUrl: collection.coverUrl,
        isDefault: collection.isDefault,
        count: 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "服务器内部错误" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PUT /api/collections/:id — 更新歌单
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const collectionId = BigInt(id);
    const body = await request.json();
    const { name, description, coverUrl } = body;

    // 检查歌单是否存在
    const existing = await prisma.collection.findUnique({
      where: { id: collectionId },
    });
    if (!existing) {
      return NextResponse.json({ error: "歌单不存在" }, { status: 404 });
    }

    // 校验名称
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
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

      // 检查名称是否与其他歌单重复
      const duplicate = await prisma.collection.findFirst({
        where: {
          name: name.trim(),
          id: { not: collectionId },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "歌单名称已存在" },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.collection.update({
      where: { id: collectionId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
        ...(coverUrl !== undefined && {
          coverUrl: coverUrl?.trim() || null,
        }),
      },
      include: {
        _count: { select: { items: true } },
      },
    });

    return NextResponse.json({
      collection: {
        id: Number(updated.id),
        name: updated.name,
        description: updated.description,
        coverUrl: updated.coverUrl,
        isDefault: updated.isDefault,
        count: updated._count.items,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "服务器内部错误" },
      { status: 500 }
    );
  }
}

// DELETE /api/collections/:id — 删除歌单
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const collectionId = BigInt(id);

    const existing = await prisma.collection.findUnique({
      where: { id: collectionId },
    });
    if (!existing) {
      return NextResponse.json({ error: "歌单不存在" }, { status: 404 });
    }

    if (existing.isDefault) {
      return NextResponse.json(
        { error: "默认歌单不可删除" },
        { status: 403 }
      );
    }

    await prisma.collection.delete({
      where: { id: collectionId },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "服务器内部错误" },
      { status: 500 }
    );
  }
}

-- CreateTable
CREATE TABLE "music" (
    "id" BIGSERIAL NOT NULL,
    "bvid" VARCHAR(20) NOT NULL,
    "aid" BIGINT,
    "cid" BIGINT NOT NULL,
    "page_index" INTEGER NOT NULL DEFAULT 1,
    "page_name" VARCHAR(255),
    "title" VARCHAR(500) NOT NULL,
    "original_title" VARCHAR(500),
    "artist" VARCHAR(255),
    "cover_url" VARCHAR(500),
    "duration" INTEGER NOT NULL DEFAULT 0,
    "audio_url" TEXT,
    "audio_quality" INTEGER,
    "audio_expire" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "music_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "cover_url" VARCHAR(500),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_item" (
    "id" BIGSERIAL NOT NULL,
    "collection_id" BIGINT NOT NULL,
    "music_id" BIGINT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "color" VARCHAR(7),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "music_tag" (
    "id" BIGSERIAL NOT NULL,
    "music_id" BIGINT NOT NULL,
    "tag_id" BIGINT NOT NULL,

    CONSTRAINT "music_tag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "music_title_idx" ON "music"("title");

-- CreateIndex
CREATE INDEX "music_artist_idx" ON "music"("artist");

-- CreateIndex
CREATE INDEX "music_status_idx" ON "music"("status");

-- CreateIndex
CREATE UNIQUE INDEX "music_bvid_page_index_key" ON "music"("bvid", "page_index");

-- CreateIndex
CREATE INDEX "collection_item_music_id_idx" ON "collection_item"("music_id");

-- CreateIndex
CREATE UNIQUE INDEX "collection_item_collection_id_music_id_key" ON "collection_item"("collection_id", "music_id");

-- CreateIndex
CREATE UNIQUE INDEX "tag_name_key" ON "tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "music_tag_music_id_tag_id_key" ON "music_tag"("music_id", "tag_id");

-- AddForeignKey
ALTER TABLE "collection_item" ADD CONSTRAINT "collection_item_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_item" ADD CONSTRAINT "collection_item_music_id_fkey" FOREIGN KEY ("music_id") REFERENCES "music"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "music_tag" ADD CONSTRAINT "music_tag_music_id_fkey" FOREIGN KEY ("music_id") REFERENCES "music"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "music_tag" ADD CONSTRAINT "music_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

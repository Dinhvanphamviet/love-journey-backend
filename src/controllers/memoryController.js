import { prisma } from "../prisma/client.js";
import { requireJourneyMember } from "../services/journeyAccess.js";
import { badRequest, forbidden, notFound } from "../utils/httpError.js";

const memoryInclude = {
  images: true,
  tags: true,
  diaries: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  },
};

async function requireMemoryMember(memoryId, userId) {
  const memory = await prisma.memory.findUnique({
    where: { id: memoryId },
    include: { journey: { include: { members: true } } },
  });

  if (!memory) {
    throw notFound("Memory not found");
  }

  if (!memory.journey.members.some((member) => member.userId === userId)) {
    throw forbidden("You are not a member of this journey");
  }

  return memory;
}

export async function createMemory(req, res) {
  const journeyId = req.body.journeyId;
  const title = req.body.title?.trim();
  const dateAt = req.body.dateAt ? new Date(req.body.dateAt) : null;
  const caption = req.body.caption?.trim() || null;
  const location = req.body.location?.trim() || null;
  const imageUrls = Array.isArray(req.body.imageUrls) ? req.body.imageUrls : [];
  const tags = Array.isArray(req.body.tags) ? req.body.tags : [];

  if (!journeyId || !title || !dateAt) {
    throw badRequest("Journey id, title and date are required");
  }

  if (Number.isNaN(dateAt.getTime())) {
    throw badRequest("Invalid memory date");
  }

  await requireJourneyMember(journeyId, req.user.id);

  const memory = await prisma.memory.create({
    data: {
      journeyId,
      title,
      dateAt,
      caption,
      location,
      images: {
        create: imageUrls
          .map((url) => `${url}`.trim())
          .filter(Boolean)
          .map((url) => ({ url })),
      },
      tags: {
        create: tags
          .map((name) => `${name}`.trim())
          .filter(Boolean)
          .map((name) => ({ name })),
      },
    },
    include: memoryInclude,
  });

  res.status(201).json({ memory });
}

export async function getJourneyMemories(req, res) {
  await requireJourneyMember(req.params.id, req.user.id);

  const memories = await prisma.memory.findMany({
    where: { journeyId: req.params.id },
    include: memoryInclude,
    orderBy: { dateAt: "asc" },
  });

  res.json({ memories });
}

export async function upsertDiary(req, res) {
  const memoryId = req.body.memoryId;
  const content = req.body.content?.trim();
  const mood = req.body.mood?.trim() || null;

  if (!memoryId || !content) {
    throw badRequest("Memory id and content are required");
  }

  await requireMemoryMember(memoryId, req.user.id);

  const diary = await prisma.memoryDiary.upsert({
    where: {
      memoryId_userId: {
        memoryId,
        userId: req.user.id,
      },
    },
    create: {
      memoryId,
      userId: req.user.id,
      content,
      mood,
    },
    update: {
      content,
      mood,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });

  res.json({ diary });
}

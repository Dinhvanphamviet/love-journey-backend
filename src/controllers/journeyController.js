import { prisma } from "../prisma/client.js";
import { requireJourneyMember } from "../services/journeyAccess.js";
import { badRequest, forbidden, notFound } from "../utils/httpError.js";
import { createInviteCode } from "../utils/inviteCode.js";

const journeyInclude = {
  members: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  },
};

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

async function uniqueInviteCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const inviteCode = createInviteCode();
    const existing = await prisma.journey.findUnique({ where: { inviteCode } });
    if (!existing) return inviteCode;
  }

  throw new Error("Could not create invite code");
}

export async function createJourney(req, res) {
  const name = req.body.name?.trim();
  const startDate = req.body.startDate ? new Date(req.body.startDate) : null;
  const coverUrl = req.body.coverUrl?.trim() || null;

  if (!name) {
    throw badRequest("Journey name is required");
  }

  if (startDate && Number.isNaN(startDate.getTime())) {
    throw badRequest("Invalid start date");
  }

  const journey = await prisma.journey.create({
    data: {
      name,
      startDate,
      coverUrl,
      inviteCode: await uniqueInviteCode(),
      members: {
        create: {
          userId: req.user.id,
          role: "OWNER",
        },
      },
    },
    include: journeyInclude,
  });

  res.status(201).json({ journey });
}

export async function joinJourney(req, res) {
  const inviteCode = req.body.inviteCode?.trim().toUpperCase();

  if (!inviteCode) {
    throw badRequest("Invite code is required");
  }

  const journey = await prisma.journey.findUnique({
    where: { inviteCode },
    include: { members: true },
  });

  if (!journey) {
    throw notFound("Invite code not found");
  }

  if (journey.members.some((member) => member.userId === req.user.id)) {
    throw badRequest("You are already in this journey");
  }

  if (journey.members.length >= 2) {
    throw forbidden("This journey already has two members");
  }

  const updatedJourney = await prisma.journey.update({
    where: { id: journey.id },
    data: {
      status: "ACTIVE",
      members: {
        create: {
          userId: req.user.id,
          role: "PARTNER",
        },
      },
    },
    include: journeyInclude,
  });

  res.json({ journey: updatedJourney });
}

export async function getJourney(req, res) {
  await requireJourneyMember(req.params.id, req.user.id);

  const journey = await prisma.journey.findUnique({
    where: { id: req.params.id },
    include: journeyInclude,
  });

  res.json({ journey });
}

export async function getCurrentJourney(req, res) {
  const membership = await prisma.journeyMember.findFirst({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      journey: {
        include: {
          ...journeyInclude,
          memories: {
            include: memoryInclude,
            orderBy: { dateAt: "asc" },
          },
        },
      },
    },
  });

  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      avatarUrl: req.user.avatarUrl,
      createdAt: req.user.createdAt,
    },
    journey: membership?.journey || null,
  });
}

import { prisma } from "../prisma/client.js";
import { forbidden, notFound } from "../utils/httpError.js";

export async function requireJourneyMember(journeyId, userId) {
  const member = await prisma.journeyMember.findUnique({
    where: {
      journeyId_userId: {
        journeyId,
        userId,
      },
    },
  });

  if (!member) {
    const journey = await prisma.journey.findUnique({ where: { id: journeyId } });
    if (!journey) throw notFound("Journey not found");
    throw forbidden("You are not a member of this journey");
  }

  return member;
}

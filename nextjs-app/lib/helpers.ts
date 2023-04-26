import prisma from './prisma';

export async function getUsageSummary(tokmon_conversation_id: string) {
  const usageSummary = await prisma.tokenUsageSummary.findUnique({
    where: { tokmon_conversation_id: tokmon_conversation_id as string },
    include: {
      chatExchanges: true,
    },
  });

  return usageSummary;
}

export async function getAllUsageSummaries(){
    const summaries = await prisma.tokenUsageSummary.findMany({
        include: {
          chatExchanges: true,
        },
        orderBy: {
          updated_at: 'desc',
        },
      });
    
    return summaries;
  }

  export async function getChatExchanges(tokmon_conversation_id: string) {
    const chatExchanges = await prisma.chatExchange.findMany({
      where: { tokmon_conversation_id: tokmon_conversation_id as string },
      include: {
        tokenUsageSummary: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return chatExchanges;
  }
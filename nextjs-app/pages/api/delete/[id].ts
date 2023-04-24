// pages/api/delete/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

async function deleteChatExchanges(tokmonConversationId: string) {
  try {
    console.log(`Deleting chat exchanges for ${tokmonConversationId}`);
    const res = await prisma.chatExchange.deleteMany({
      where: { tokmon_conversation_id: tokmonConversationId },
    });
    console.log(`Deleted ${res.count} chat exchanges`);
  } catch (error) {
    console.error(error);
    return false;
  }
  return true;
}

async function deleteTokenUsageSummary(tokmonConversationId: string) {
  try {
    console.log(`Deleting token usage summary for ${tokmonConversationId}`);
    const res = await prisma.tokenUsageSummary.deleteMany({
      where: { tokmon_conversation_id: tokmonConversationId },
    });
    console.log(`Deleted ${res.count} usage summary`);
  } catch (error) {
    console.error(error);
    return false;
  }
  return true;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { id },
  } = req;

  if (req.method === 'DELETE') {
    console.log(`Got a request to DELETE id: ${id}`);

    const chatDeleteSuccess = await deleteChatExchanges(id as string);
    const usageDeleteSuccess = await deleteTokenUsageSummary(id as string);

    if (chatDeleteSuccess || usageDeleteSuccess) {
        res.status(200).json({ message: 'Record deleted successfully' });
        return;
    }

    res.status(500).json({ error: 'An error occurred while deleting the record.' });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
import type { NextApiRequest, NextApiResponse } from 'next';
import WebSocket from 'ws';
import prisma from '../../lib/prisma';
import { getChatExchanges } from '@/lib/helpers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const chatExchange = req.body;
    const rollingUsageSummary = chatExchange.summary;

    // Validate chatExchange data here
    console.log('chatExchange: ', JSON.stringify(chatExchange, null, 2));

    // Find the existing tokenUsageSummary, or create a new one
    let tokenUsageSummary = await prisma.tokenUsageSummary.findFirst({
      where: {
        chatExchanges: {
          some: {
            tokmon_conversation_id: chatExchange.tokmon_conversation_id,
          },
        },
      },
    });

    if (!tokenUsageSummary) {
      // Create a new tokenUsageSummary
      tokenUsageSummary = await prisma.tokenUsageSummary.create({
        data: {
          ...rollingUsageSummary
        },
      });

    } else {
      tokenUsageSummary = await prisma.tokenUsageSummary.update({
        where: {
          id: tokenUsageSummary.id,
        },
        data: {
          ...rollingUsageSummary
        },
      });
    }

    if (chatExchange.tokmon_conversation_id === undefined) {
      res.status(400).json({ error: 'tokmon_conversation_id is required' });
      return;
    }

    const savedChatExchange = await prisma.chatExchange.create({
      data: {
        tokmon_conversation_id: chatExchange.tokmon_conversation_id,
        request: chatExchange.request,
        response: chatExchange.response,
        tokenUsageSummaryId: tokenUsageSummary.id,
      },
    });

    // Send incoming data to the WebSocket server
    const ws = new WebSocket(`ws://${process.env.WSS_CONTAINER_NAME}:${process.env.WSS_PORT}`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'chatExchange', data: savedChatExchange }));
      ws.send(JSON.stringify({ type: 'tokenUsageSummary', data: tokenUsageSummary }));
      ws.close();
    };

    ws.onerror = (error) => {
      console.log(`WebSocket error:`, error);
    };

    res.status(200).json(savedChatExchange);

  } else if (req.method === 'GET') {
    try {
      const tokmon_conversation_id = req.query.tokmon_conversation_id;

      let retData;

      if (tokmon_conversation_id !== undefined) {        
        retData = await getChatExchanges(tokmon_conversation_id as string);

      } else {
        retData = await prisma.chatExchange.findMany({
          include: {
            tokenUsageSummary: true,
          },
          orderBy: {
            timestamp: 'desc',
          },
        });
      }
  
      res.status(200).json(retData);

    } catch (error) {
      res.status(500).json({ error: 'An error occurred while fetching the data.' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
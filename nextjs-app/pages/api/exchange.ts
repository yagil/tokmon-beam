import type { NextApiRequest, NextApiResponse } from 'next';
import WebSocket from 'ws';
import prisma from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const chatExchange = req.body;
    // Validate chatExchange data here
    console.log('chatExchange: ', JSON.stringify(chatExchange, null, 2));

    // Find an existing tokenUsageSummary
    const existingTokenUsageSummary = await prisma.tokenUsageSummary.findFirst({
      where: {
        chatExchanges: {
          some: {
            tokmon_conversation_id: chatExchange.tokmon_conversation_id,
          },
        },
      },
    });

    let tokenUsageSummaryId;

    if (!existingTokenUsageSummary) {
      // Create a new tokenUsageSummary
      const newTokenUsageSummary = await prisma.tokenUsageSummary.create({
        data: {
          tokmon_conversation_id: chatExchange.tokmon_conversation_id,
          total_cost: 0, // Replace with the actual cost
          total_usage: {}, // Replace with the actual usage data
          pricing_data: {}, // Replace with the actual pricing data
          models: [], // Replace with the actual models array
        },
      });
      tokenUsageSummaryId = newTokenUsageSummary.id;
    } else {
      tokenUsageSummaryId = existingTokenUsageSummary.id;
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
        tokenUsageSummaryId: tokenUsageSummaryId,
      },
    });

    // Send incoming data to the WebSocket server
    const ws = new WebSocket(`ws://${process.env.WSS_CONTAINER_NAME}:${process.env.WSS_PORT}`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'chatExchange', data: savedChatExchange }));
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
        
        retData = await prisma.chatExchange.findMany({
          where: { tokmon_conversation_id: tokmon_conversation_id as string },
          include: {
            tokenUsageSummary: true,
          },
          orderBy: {
            timestamp: 'desc',
          },
        });

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
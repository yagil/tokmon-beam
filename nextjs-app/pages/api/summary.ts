import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import WebSocket from 'ws';
import { getAllUsageSummaries, getUsageSummary } from '@/lib/helpers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const tokenUsageSummary = req.body.summary;
    console.log('tokenUsageSummary: ', JSON.stringify(tokenUsageSummary, null, 2));

    let savedTokenUsageSummary: any;

    // Find an existing tokenUsageSummary
    const existingTokenUsageSummary = await prisma.tokenUsageSummary.findFirst({
      where: {
        tokmon_conversation_id: tokenUsageSummary.tokmon_conversation_id,
      },
    });

    if (existingTokenUsageSummary) {
      // Update the existing tokenUsageSummary
      savedTokenUsageSummary = await prisma.tokenUsageSummary.update({
        where: { id: existingTokenUsageSummary.id },
        data: {
          total_cost: tokenUsageSummary.total_cost,
          total_usage: tokenUsageSummary.total_usage,
          pricing_data: tokenUsageSummary.pricing_data,
          models: tokenUsageSummary.models,
        },
      });
    } else {
      // Create a new tokenUsageSummary
      savedTokenUsageSummary = await prisma.tokenUsageSummary.create({
        data: tokenUsageSummary,
      });

      console.log(`Saved tokenUsageSummary: ${JSON.stringify(savedTokenUsageSummary)}`);
    }

    // Send incoming data to the WebSocket server
    const ws = new WebSocket(`ws://${process.env.WSS_CONTAINER_NAME}:${process.env.WSS_PORT}`);
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'tokenUsageSummary', data: savedTokenUsageSummary }));
      ws.close();
    };

    res.status(200).json(savedTokenUsageSummary);

  } else if (req.method === 'GET') {
    try {
      const tokmon_conversation_id = req.query.tokmon_conversation_id;
      
      let retData;
      if (tokmon_conversation_id !== undefined) {
        retData = await getUsageSummary(tokmon_conversation_id as string);
      } else {
        retData = await getAllUsageSummaries();
      }
      res.status(200).json(retData);
    } catch (error) {
      console.error(`Error fetching data: ${error}`);
      res.status(500).json({ error: 'An error occurred while fetching the data.' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
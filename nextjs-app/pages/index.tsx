import { useEffect, useState } from 'react';
import * as React from 'react';
import { useRouter } from 'next/router';
import { TokenUsageSummary } from '@prisma/client';
import { formatDate } from '../lib/utils';

export async function getServerSideProps() {
  const wssPort = Number(process.env.WSS_PORT);
  
  return {
    props: {
      wssPort
    },
  };
}

export type IndexProps = {
  wssPort: number;
};

export default function Index({ wssPort } : IndexProps) {
  const [summaries, setSummaries] = useState<TokenUsageSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  useEffect(() => {
    fetch('/api/summary')
      .then((res) => res.json())
      .then((data) => setSummaries(data))
      .catch((error) => {
        console.error('Error fetching summaries:', error)
        setError(error.message);
      });

    const ws = new WebSocket(`ws://localhost:${wssPort}`);
    ws.onopen = () => {
      console.log('Connected to websocket server');
    }
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data.toString());
      
      const data = message.data;
      const type = message.type;

      if (type === 'tokenUsageSummary') {
        setSummaries((prevSummaries) => [data, ...prevSummaries]);
      }
    }
    return () => {
      ws.close();
    }
  }, []);

  const deleteSummary = async (id: string) => {
    try {
      // show "Are you sure?" alert
      if (!confirm('Are you sure you want to delete this summary?')) {
        return;
      }
      // delete summary
      await fetch(`/api/delete/${id}`, { method: 'DELETE' });
      setSummaries((prevSummaries) => prevSummaries.filter((summary) => summary.tokmon_conversation_id !== id));
    } catch (error) {
      console.error('Error deleting summary:', error);
    }
  };

  if (error) return <div className="container mx-auto p-10">Error: {error}</div>;

  return (
    <div className="container mx-auto p-10">
      <h1 className="text-2xl font-bold mb-4">Conversations</h1>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2">Timestamp</th>
            <th className="border p-2">Program</th>
            <th className="border p-2">Conversation ID</th>
            <th className="border p-2">Total Cost</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {summaries.map((summary) => (
            <tr key={summary.id}>
              <td className="border p-2">{formatDate(summary.timestamp)}</td>
              <td className="border p-2">{summary.monitored_program}</td>
              <td
                className="border p-2 cursor-pointer hover:underline"
                onClick={() => router.push(`/conversation/${summary.tokmon_conversation_id}`)}
              >
                {summary.tokmon_conversation_id}
              </td>
              <td className="border p-2">${summary.total_cost}</td>
              <td className="border p-2">
                <button
                  className="text-red-500 hover:text-red-700"
                  onClick={() => deleteSummary(summary.tokmon_conversation_id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
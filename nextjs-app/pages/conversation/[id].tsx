import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import * as React from 'react';
import { ChatExchange, TokenUsageSummary } from '@prisma/client';

// server side props
export async function getServerSideProps() {
  const wssPort = Number(process.env.WSS_PORT);

  return {
    props: {
      wssPort,
    },
  };
}

// props
export type ConversationProps = {
  wssPort: number;
};

export default function Conversation({ wssPort }: ConversationProps) {
  const [exchanges, setExchanges] = useState<ChatExchange[]>([]);
  const [summary, setSummary] = useState<TokenUsageSummary|null>(null);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      fetch(`/api/exchange?tokmon_conversation_id=${id}`)
        .then((res) => res.json())
        .then((data) => setExchanges(data));

      fetch(`/api/summary?tokmon_conversation_id=${id}`)
        .then((res) => res.json())
        .then((data) => setSummary(data));
    }

    const ws = new WebSocket(`ws://localhost:${wssPort}`);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data.toString());
      
      const data = message.data;
      const type = message.type;

      if (data.tokmon_conversation_id !== id) return;

      if (type === 'chatExchange') {
        setExchanges((prevExchanges) => [data, ...prevExchanges]);
      } else if (type === 'tokenUsageSummary') {
        setSummary(data);
      }
    };

    return () => {
      ws.close();
    };
  }, [id]);

  return (
    <div className="container bg-slate-50 w-screen p-10">
      {/* back button */}
      <button
        className="mb-4 underline"
        onClick={() => router.push('/')}
      >
        ← Home
      </button>
      <h1 className="py-5 text-2xl font-medium mb-4 flex flex-row gap-x-3">Conversation <pre>{id}</pre></h1>
      <hr></hr>
      
      <div className="py-10 px-5 bg-slate-200 mx-auto w-screen mb-5">
        <h1 className="text-xl font-medium mb-5"> Usage Summary</h1>
        <pre>
          {summary && 
          // a little table that shows total_cost,id, tokmon_conversation_id, total_usage, pricing_data, models
          <>
            <table>
              <thead>
                <tr className="flex gap-10">
                  <th>total_cost</th>
                  <th>total_usage</th>
                </tr>
              </thead>
              <tbody>
                <tr className="flex gap-4">
                  <td className="font-bold text-blue-600">${summary.total_cost}</td>
                  <td>{JSON.stringify(summary.total_usage)}</td>
                </tr>
              </tbody>
            </table>
          </>

            || 'No summary yet'}
        </pre>
      </div>

      <hr></hr>

      <ul className="w-screen">
      {exchanges.map((exchange, index) => (
          <li key={index} className={"p-5 flex flex-col space-y-5 odd:bg-gray-200 even:bg-slate-50 "}>
            <div>
              <strong>Request:</strong> <pre className="overflow-x-clip">{JSON.stringify(exchange.request)}</pre>
            </div>
            <div>
              <strong>Response:</strong> <pre>{JSON.stringify(exchange.response)}</pre>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

import { useRouter } from 'next/router';
import Head from 'next/head'
import { useEffect, useState } from 'react';
import * as React from 'react';
import { ChatExchange, TokenUsageSummary } from '@prisma/client';
import { getChatExchanges, getUsageSummary } from '@/lib/helpers';

export async function getServerSideProps(context: any) {
  const wssPort = Number(process.env.WSS_PORT);
  const { id } = context.query;
  const storedExchanges = await getChatExchanges(id);
  const storedSummary = await getUsageSummary(id);

  return {
    props: {
      storedExchanges: JSON.parse(JSON.stringify(storedExchanges)),
      storedSummary: JSON.parse(JSON.stringify(storedSummary)),
      wssPort,
    },
  };
}

export type ConversationProps = {
  wssPort: number;
  storedExchanges: ChatExchange[];
  storedSummary: TokenUsageSummary;
};

function UsageSummaryTable({ summary }: { summary: TokenUsageSummary }) {
  const { monitored_program, total_cost, total_usage, models } = summary;
  const { total_tokens, total_prompt_tokens, total_completion_tokens } = total_usage as { total_tokens: number, total_prompt_tokens: number, total_completion_tokens: number};

  return (
    <>
      <div className="flex flex-col text-center mb-5 justify-center space-y-5">
        <h1 className="text-md text-xl font-medium"> Usage Summary</h1>
        <p className="font-mono text-sm py-1 px-3 bg-indigo-900 text-white rounded-md w-fit mx-auto">{monitored_program}</p>
      </div>
      <table className="w-full">
        <thead className="bg-slate-200">
          <tr className="text-center">
            <th className="border border-black p-2">Total cost</th>
            <th className="border border-black p-2">Models</th>
            <th className="border border-black p-2">Total tokens</th>
            <th className="border border-black p-2">Total prompt tokens</th>
            <th className="border border-black p-2">Total completion tokens</th>
            
          </tr>
        </thead>
        <tbody className="text-center">
          <tr id="summary">
            <td className="border border-black p-2 font-bold bg-emerald-200">${total_cost}</td>
            <td className="border border-black p-2">{models}</td>
            <td className="border border-black p-2">{total_tokens}</td>
            <td className="border border-black p-2">{total_prompt_tokens}</td>
            <td className="border border-black p-2">{total_completion_tokens}</td>
            
          </tr>
        </tbody>
      </table>
    </>
  );
}

function ChatExchange({ exchange }: { exchange: ChatExchange}) {
  const { id, timestamp, request, response } = exchange;

  return (
    <>
      <div>
        <strong>Response:</strong>
        <pre className="whitespace-break-spaces">{JSON.stringify(response, null, 2)}</pre>
      </div>
      <div>
        <strong>Request:</strong>
        <pre className="whitespace-break-spaces">{JSON.stringify(request, null, 2)}</pre>
      </div>
      </>
  );
}

function JsonExportButton({ exchanges, summary, id }: { exchanges: ChatExchange[], summary: TokenUsageSummary|null, id: string }) {
  return (
    <button className="underline a-like" onClick={() => {
      const element = document.createElement('a');
      
      const file = new Blob([JSON.stringify(summary, null, 2)], {type: 'application/json'});
      element.href = URL.createObjectURL(file);
      element.download = `tokmon-${id}.json`;
      document.body.appendChild(element);
      element.click();
    }}>Export JSON</button>
  );
}

export default function Conversation({ wssPort, storedExchanges, storedSummary }: ConversationProps) {
  const [exchanges, setExchanges] = useState<ChatExchange[]>(storedExchanges);
  const [summary, setSummary] = useState<TokenUsageSummary>(storedSummary);
  const router = useRouter();
  const { id } = router.query as { id: string };
  const pageTitle = id ? `tokmon explorer • ${id}` : 'tokmon explorer';
  
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
        const summaryElement = document.getElementById('summary');
        if (summaryElement) {
          summaryElement.classList.add('bg-green-100');
          setTimeout(() => {
            summaryElement.classList.remove('bg-green-100');
          }, 1000);
        }
      }
    };

    return () => {
      ws.close();
    };
  }, [id]);

  

  return (
    <>
    <Head>
        <title>{pageTitle}</title>
    </Head>
      
    <div className="flex flex-row justify-between border border-b-1 border-b-gray-300 px-5 mb-5">
      <div className="flex flex-row space-x-2 py-5">
        <button className="underline a-like" onClick={() => router.push('/')} > ← All Logs</button>
        <h1 className="flex flex-row gap-x-2 whitespace-nowrap "> / <pre>{id}</pre></h1>
      </div>
    
      <JsonExportButton exchanges={exchanges} summary={summary} id={id} />
    </div>

    <div className="px-5">
      <div className="mb-5">
          {summary &&  <UsageSummaryTable summary={summary} /> || 'No data yet'}
      </div>

      <ul>
        {exchanges.map((exchange, index) => (
          <li key={index} className={"p-5 flex flex-col space-y-5 odd:bg-gray-200 even:bg-slate-50 "}>
            <ChatExchange exchange={exchange} />
          </li>
        ))}
      </ul>

    </div>
    
    </>
  );
}

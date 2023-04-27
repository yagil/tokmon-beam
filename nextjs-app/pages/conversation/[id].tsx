import { useRouter } from 'next/router';
import Head from 'next/head'
import { useEffect, useState } from 'react';
import * as React from 'react';
import { ChatExchange, TokenUsageSummary } from '@prisma/client';
import { getAllChatExchanges, getUsageSummary } from '@/lib/helpers';
import { ChatMessage, ChatRequest, ChatResponse, PricingData } from '@/lib/types';
import { formatDate, colorForModel, FRACTION_DIGITS } from '@/lib/utils';

export async function getServerSideProps(context: any) {
  const wssPort = Number(process.env.WSS_PORT);
  const { id } = context.query;
  const storedExchanges = await getAllChatExchanges(id);
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
  const { total_cost, total_usage, models } = summary;
  const { total_tokens, total_prompt_tokens, total_completion_tokens } = total_usage as { total_tokens: number, total_prompt_tokens: number, total_completion_tokens: number};

  // Avoid hydration mismatch
  const [lastUpdated, setLastUpdated] = useState<string>("");
  useEffect(() => {
    setLastUpdated(formatDate(summary.updated_at));
  }, [summary.updated_at]);

  return (
    <div className="space-y-5">      
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th className="border p-2 whitespace-nowrap w-1 text-left">Last update</th>
            <th className="border p-2">Total <code className="bg-indigo-400/20 px-1 py-0.5 rounded-md">prompt</code> tokens</th>
            <th className="border p-2">Total <code className="bg-yellow-400/20 px-1 py-0.5 rounded-md">completion</code> tokens</th>
            <th className="border p-2">Models</th>
            <th className="border p-2">Total overall tokens</th>
            <th className="border p-2">Total cost</th>
            
          </tr>
        </thead>
        <tbody className="text-center">
          <tr id="summary">
            <td className="border p-2 whitespace-nowrap w-1/12">{lastUpdated}</td>
            
            
            <td className="border p-2">{total_prompt_tokens}</td>
            <td className="border p-2">{total_completion_tokens}</td>
            <td className="border p-2 space-y-2">
              {models.map((model, index) => (
                <div key={index} className={"rounded-md py-1 px-2 text-xs font-mono" + " " + colorForModel(model)}>
                  {model}
                </div>
              ))}
            </td>        
            <td className="border p-2 font-medium bg-emerald-200/20">{total_tokens}</td>
            <td className="border p-2 font-medium bg-blue-200/20">${total_cost.toFixed(FRACTION_DIGITS)}</td>
            
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function JsonExportButton({ summary, id }: { summary: TokenUsageSummary|null, id: string }) {
  return (
    <button className="underline a-like" onClick={() => {
      const element = document.createElement('a');
      const file = new Blob([JSON.stringify(summary, null, 2)], {type: 'application/json'});
      element.href = URL.createObjectURL(file);
      element.download = `tokmon-${id}.json`;
      document.body.appendChild(element);
      element.click();
    }}>Save to file</button>
  );
}

function ChatExchangeStatsRow({ exchange, summary }: { exchange: ChatExchange, summary: TokenUsageSummary }) {
  if (summary.pricing_data === undefined) {
    return <></>;
  }

  const pricingString = summary.pricing_data as string;
  const pricing = JSON.parse(pricingString.replace(/'/g, "\""));
  const response = exchange.response as ChatResponse;
  
  const { model, usage } = response;

  const getStyleMessage = (message: ChatMessage, classes?: string) => {
    const { content, role } = message;
    let color: string;
    let styledRole = role;

    if (role === "system") {
      color = "bg-yellow-400/50";
    } else if (role === "user") {
      color = "bg-green-400/50";
    } else {  // role === 'assistant'
      color = colorForModel(model);
      styledRole = role;
    }

    return (
        <span className={"text-sm bg-gray-200/40 py-2 px-3 rounded-md block" + " " + classes}>
          <span className={"py-0.5 px-1 inline-block mr-2 rounded-md " + color}>{styledRole}</span>
          {content}
        </span>
    );
  }

  const RequestView = ({request } : {request: ChatRequest}) => {
    return ( 
      <div className="space-y-1">
        
        <div className="px-2 py-2 text-gray-500 bg-gray-100/60 border-b flex flex-row">
          <p className="text-xs font-medium sticky top-0">Total <b>{request.messages.length} messages</b> in this request body</p>
          <p className="text-xs font-base ml-auto opacity-60">scrollable</p>
        </div>
        
        <div className="h-32 overflow-y-auto space-y-2 p-2">
          { request.messages.map((message, index) => (
          <div key={index}>{getStyleMessage(message, "inline-block")}</div>
          )) } 
        </div>
        
      </div>
    );
  }

  const ResponseView = ({ response } : { response: ChatResponse }) => {
    const lastMessage = response.messages[response.messages.length - 1];
    return (
      <div>
        {getStyleMessage(lastMessage)}
      </div>
    );
  }

  const calculateCostSummary = () => {
    if (pricing[model] === undefined) {
      console.error(`Pricing data for model ${model} not found.`);
      return {
        prompt: -1,
        completion: -1,
        total: -1
      };
    }

    const { completion_tokens, prompt_tokens } = usage;
    const { prompt_cost, completion_cost, per_tokens } = pricing[model];
    
    const promptDollarAmount = prompt_cost * prompt_tokens / per_tokens;
    const completionDollarAmount = completion_cost * (completion_tokens) / per_tokens;

    return {
      prompt: promptDollarAmount,
      completion: completionDollarAmount,
      total: promptDollarAmount + completionDollarAmount
    }
  }

  const timestampRaw = exchange.timestamp.toString();
  const formattedDate = formatDate(exchange.timestamp);
  const costSummary = calculateCostSummary();
  
  return (
    <tr key={exchange.id} className="even:bg-gray-200/20" id={"exchange-row-"+exchange.id}>
      <td className="border p-2 text-gray-700 whitespace-nowrap w-1/12 text-center" title={timestampRaw}>
        {formattedDate}
      </td>

      <td className="border p-0 lg:w-[28%] align-top">
        <RequestView request={exchange.request as ChatRequest} />
      </td>

      <td className="border p-2">
        <ResponseView response={exchange.response as ChatResponse} />
      </td>
      
      <td className="border  p-2">
        <div className={"rounded-md text-sm p-2" + " " + colorForModel(model)}>
          <code className="text-xs block lg:whitespace-nowrap">{model}</code>
        </div>
      </td>
      
      <td className="border  p-2 whitespace-nowrap text-center">
        {usage.prompt_tokens}
        {" "}<span className="text-gray-400">(${ costSummary.prompt.toFixed(FRACTION_DIGITS) })</span>
      </td>
      <td className="border  p-2 whitespace-nowrap text-center">
        {usage.completion_tokens}
        {" "}<span className="text-gray-400">(${ costSummary.completion.toFixed(FRACTION_DIGITS) })</span>
        
      </td>
      <td className="border  p-2 text-center">
        <p className="font-medium">${ costSummary.total.toFixed(FRACTION_DIGITS) }</p>
      </td>

      <td className="border  p-2 text-center">
        [<a href={"/exchange/" + exchange.id} className="text-blue-500 hover:text-blue-700">JSON</a>]
      </td>
    </tr>
  );
}

function ChatExchangeTable({ exchanges, summary }: { exchanges: ChatExchange[], summary: TokenUsageSummary }) {
  return (
    <>
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-100 text-left">
          <th className="border p-2 whitespace-nowrap w-1">Last update</th>
          <th className="border p-2">Request</th>
          <th className="border p-2">Response</th>
          <th className="border p-2 text-center">Model</th>
          <th className="border p-2 text-center whitespace-nowrap w-1">Prompt tokens</th>
          <th className="border p-2 whitespace-nowrap w-1 text-center">Completion tokens</th>
          <th className="border p-2 text-center whitespace-nowrap w-1">Round-trip cost</th>
          <th className="border p-2 text-center whitespace-nowrap w-1">Actions</th>
        </tr>
      </thead>

      <tbody id="exchanges-table-body">
        {exchanges.length === 0 && (
          <tr>
            <td className="border p-2 text-gray-700" colSpan={6}>No data.</td>
          </tr>
        )}
        
        {exchanges.map( ( exchange, index ) => (
          <ChatExchangeStatsRow key={index} exchange={exchange} summary={summary} />  
        ))
      }
      </tbody>
    </table>
    </>
  );
}

function InfoActionBar({ summary }: { summary: TokenUsageSummary } ) {
  return (
    <div className="flex flex-col text-center justify-center space-y-5">
      <div className="flex flex-row w-fit mx-auto gap-x-3 items-center">
        {/* <h1 className="text-sm font-medium"> tokmon </h1> */}

        <div>[ <a href="?raw=true" className="underline">Raw JSON</a> ]</div>
        <div>[ <JsonExportButton summary={summary} id={summary.tokmon_conversation_id} /> ]</div>
      </div>
    </div>
  );
}

export default function Conversation({ wssPort, storedExchanges, storedSummary }: ConversationProps) {
  const [exchanges, setExchanges] = useState<ChatExchange[]>(storedExchanges);
  const [summary, setSummary] = useState<TokenUsageSummary>(storedSummary);
  const [streamingStarted, setStreamingStarted] = useState<boolean>(false);
  
  const router = useRouter();
  const { id } = router.query as { id: string };
  
  const pageTitle = id ? `tokmon explorer • ${id}` : 'tokmon explorer';

  const raw = router.query.raw === 'true' || router.query.raw === "1";
  
  if (raw) {
    return (
      <div className="p-1.5">
        <Head>
          <title>{pageTitle}</title>
        </Head>
        <pre className="whitespace-break-spaces text-xs">
          {JSON.stringify(summary, null, 2)}
        </pre>
      </div>
    );
  }
  
  useEffect(() => {
    setExchanges(storedExchanges);
    setSummary(storedSummary);
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
        setStreamingStarted(true);
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

  useEffect(() => {
    if (!streamingStarted) return;
    const topRow = document.getElementById("exchanges-table-body")!.firstChild as HTMLElement;
    if (topRow) {
      console.log(`topRow: ${topRow.id}`);
      topRow.classList.add('bg-green-100');
      setTimeout(() => {
        topRow.classList.remove('bg-green-100');
      }, 1000);
    }
  }, [exchanges]);

  return (
    <>
      <Head>
          <title>{pageTitle}</title>
      </Head>
        
      <div className="flex flex-row justify-between border border-b-1 border-b-gray-300 px-5 mb-5">
        <div className="flex flex-row py-5">
          <a className="underline" href="/" > ← All Logs</a>
          <span className="flex flex-row gap-x-2 whitespace-nowrap ml-2"> / <pre>{id}</pre></span>
        </div>
        { summary && <InfoActionBar summary={summary} /> }
      </div>

      <div className="px-5 space-y-10 pb-20">
        {/* <div className="mb-5"> */}
            {summary && 

            <div className="space-y-5">
              <div className="flex flex-row w-fit space-x-2 items-center">
                <h1 className="text-lg font-medium">Usage Summary</h1>
                <p className="font-mono text-sm py-0.5 px-2 bg-gray-100 text-gray-700 rounded-md w-fit mx-auto">{summary.monitored_program}</p>
              </div>
              <UsageSummaryTable summary={summary} /> 
            </div>

            
            || 
            <div>
              <p>No data for for this converation ID.</p>
              <p>Double check the URL.</p>
            </div>}
        {/* </div> */}
        
        { exchanges && exchanges.length > 0 &&
        <div className="mt-10 space-y-5">
          <h1 className="text-lg font-medium">Request/Response Log</h1>
          <ChatExchangeTable exchanges={exchanges} summary={summary} />
        </div>
        }
      </div>
    
    </>
  );
}

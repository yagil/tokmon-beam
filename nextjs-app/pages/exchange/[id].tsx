// a nextjs page that calls getChatExchange and renders raw json

import Head from 'next/head';
import { getChatExchange } from '../../lib/helpers';
import { ChatExchange } from '@prisma/client';

// get id from path
interface ExchangeProps {
    exchange: ChatExchange;
}


export async function getServerSideProps(context: any) {
    const { id } = context.query;
    const exchange = await getChatExchange(id);
    console.log(`chatExchange: ${JSON.stringify(exchange, null, 2)}`);
    const parsedExchanged = JSON.parse(JSON.stringify(exchange));
    return { props: { exchange: parsedExchanged } };
}

export default function Exchange({ exchange }: ExchangeProps) {
    const pageTitle = `tokmon explorer • exchange/${exchange.id}`;
    return (
        <div className="p-1.5">
            <Head>
            <title>{pageTitle}</title>
            </Head>
            <pre className="whitespace-break-spaces text-xs">
            {JSON.stringify(exchange, null, 2)}
            </pre>
        </div>
    );
};

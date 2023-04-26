
import Head from 'next/head'
import * as React from 'react';
import { Instructions } from '.';
export default function Help() {
    return (
        <>
        <Head>
            <title>Tokmon Explorer - Help</title>
        </Head>
        
        <div className="flex flex-row justify-between border border-b-1 border-b-gray-300 px-5 mb-5">
            <div className="flex flex-row py-5">
                <a className="underline a-like" href="/"> ← Home</a>
            </div>
        </div>

        <div className="mb-20">
            <Instructions onHomeScreen={false}/>
        </div>

        <hr></hr>

        <div className="w-1/3 mx-auto p-10">
            <h3 className="font-medium text-xl mb-3">More help</h3>
            <p>
                If you're running into bugs, please <a className="underline a-like" href="https://github.com/yagil/tokmon-beam/issues" target="_blank" rel="noopener noreferrer">open an issue on github</a>.
            </p>
        </div>
        </>
    )
}
import '@/styles/globals.css'
import type { AppProps } from 'next/app'

// define a top bar component.
const TopBar = () => {
    return <div className="top-bar p-5 border border-b-1 bg-gray-200">
        <div className="top-bar-left">
            <ul className="menu">
                <li className="menu-text">tokmon explorer</li>
            </ul>
        </div>
    </div>
}

export default function App({ Component, pageProps }: AppProps) {
    return <>
        <TopBar />
        <Component {...pageProps} />
    </>
}

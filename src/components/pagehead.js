import Head from 'next/head'

const PageHead = ({ children, title = 'NanoDx - Partner Portal' }) => {
    return (

        <Head>
            <title>{title}</title>
            {children}
        </Head>
    )
}

export default PageHead

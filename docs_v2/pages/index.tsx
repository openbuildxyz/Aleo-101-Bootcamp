import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const destination = '/learn/what-is-aleo/background'
const staticExportDestination = 'learn/what-is-aleo/background'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace(destination)
  }, [router])

  return (
    <Head>
      <meta httpEquiv="refresh" content={`0; url=${staticExportDestination}`} />
    </Head>
  )
}

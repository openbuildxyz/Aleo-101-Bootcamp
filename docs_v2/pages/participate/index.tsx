import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const destination = '/participate/wallets'
const staticExportDestination = 'participate/wallets'

export default function Participate() {
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

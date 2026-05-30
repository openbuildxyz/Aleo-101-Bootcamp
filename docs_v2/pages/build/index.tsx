import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const destination = '/build/getting-started'
const staticExportDestination = 'build/getting-started'

export default function Build() {
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

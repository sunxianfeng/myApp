import Layout from '@/components/common/Layout'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Layout>{children}</Layout>
}

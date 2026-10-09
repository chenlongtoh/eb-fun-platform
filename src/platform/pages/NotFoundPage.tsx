import { useDocumentTitle } from '@/platform/useDocumentTitle.ts'

export function NotFoundPage({ message }: { message?: string }) {
  useDocumentTitle('Not found')

  return (
    <section className="notice">
      <h1>Not found</h1>
      <p>{message ?? 'That page is not part of the platform.'}</p>
    </section>
  )
}

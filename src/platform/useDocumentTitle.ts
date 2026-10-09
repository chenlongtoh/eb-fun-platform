import { useEffect } from 'react'
import { PLATFORM_NAME } from '@/platform/brand.ts'

/** Sets `document.title` from a plain string. Resets to the platform name when omitted. */
export function useDocumentTitle(pageTitle?: string) {
  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} · ${PLATFORM_NAME}` : PLATFORM_NAME
  }, [pageTitle])
}

import { Link, Outlet, useMatch } from 'react-router'
import { PLATFORM_NAME } from '@/platform/brand.ts'

export function PlatformLayout() {
  const onLobby = useMatch({ path: '/', end: true })

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden="true">
              EB
            </span>
            <span className="brand-name">{PLATFORM_NAME}</span>
          </Link>
          {onLobby ? (
            <p className="topbar-note">Game lobby</p>
          ) : (
            <Link to="/" className="back-link">
              Back to lobby
            </Link>
          )}
        </div>
      </header>
      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  )
}

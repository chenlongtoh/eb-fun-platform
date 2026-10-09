import { BrowserRouter, Route, Routes } from 'react-router'
import { PlatformLayout } from '@/platform/layout/PlatformLayout.tsx'
import { GamePage } from '@/platform/pages/GamePage.tsx'
import { LobbyPage } from '@/platform/pages/LobbyPage.tsx'
import { NotFoundPage } from '@/platform/pages/NotFoundPage.tsx'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PlatformLayout />}>
        <Route index element={<LobbyPage />} />
        <Route path="games/:slug" element={<GamePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '')

export default function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <AppRoutes />
    </BrowserRouter>
  )
}

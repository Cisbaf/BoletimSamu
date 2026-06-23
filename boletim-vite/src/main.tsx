import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { ChakraProvider } from '@chakra-ui/react'
import { system } from './theme/index.ts'
import HomePage from './pages/Home.tsx'
import SolicitarCopiaPage from './pages/SolicitarCopia.tsx'
import LayoutApp from './components/LayoutApp.tsx'
import { LoadingProvider } from './context/LoadingContext.tsx'
import { Toaster } from './components/Toaster.tsx'
import AcompanharSolicitacao from './pages/Acompanhar.tsx'
import { PrivateRoute } from './components/PrivateRoute.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import Login from './pages/Login.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// Painel é área restrita — carregado sob demanda para não inflar o bundle inicial
const PainelAdm = lazy(() => import('./pages/Painel.tsx'))

const router = createBrowserRouter([
  {
    element: (
      <AuthProvider>
        <LayoutApp />
      </AuthProvider>
    ),
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/solicitar", element: <SolicitarCopiaPage /> },
      { path: "/acompanhar", element: <AcompanharSolicitacao/> },
      { path: "/painel", element: (
          <PrivateRoute>
            <Suspense fallback={<div>Carregando...</div>}>
              <PainelAdm/>
            </Suspense>
          </PrivateRoute>
      )},
      { path: "/login", element: <Login/>}
    ]
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ChakraProvider value={system}>
        <Toaster/>
        <LoadingProvider>
          <RouterProvider router={router}/>
        </LoadingProvider>
      </ChakraProvider>
    </ErrorBoundary>
  </StrictMode>,
)

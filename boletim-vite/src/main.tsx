import { StrictMode } from 'react'
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
import PainelAdm from './pages/Painel.tsx'
import { PrivateRoute } from './components/PrivateRoute.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import Login from './pages/Login.tsx'


const router = createBrowserRouter([
  {
    element: (
      <AuthProvider>
        <LayoutApp />
      </AuthProvider>
    ), // 👈 layout dentro do router
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/solicitar", element: <SolicitarCopiaPage /> },
      { path: "/acompanhar", element: <AcompanharSolicitacao/> },
      { path: "/painel", element: (
          <PrivateRoute>
            <PainelAdm/>
          </PrivateRoute>
      )},
      { path: "/login", element: <Login/>}
    ]
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider value={system}>
      <Toaster/>
      <LoadingProvider>
          <RouterProvider router={router}/>
      </LoadingProvider>
    </ChakraProvider>
  </StrictMode>,
)

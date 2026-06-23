import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isTokenExpired } from "../helpers/jwtUtils";

export function PrivateRoute({ children }: any) {
  const { token, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>; // ou spinner
  }

  // Rejeita se não há token ou se está expirado (AuthContext já tentou refresh no mount)
  if (!token || isTokenExpired(token)) {
    return <Navigate to="/login" />;
  }

  return children;
}

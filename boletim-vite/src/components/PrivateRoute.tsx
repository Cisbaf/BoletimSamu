import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function PrivateRoute({ children }: any) {
  const { token, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>; // ou spinner
  }

  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
}
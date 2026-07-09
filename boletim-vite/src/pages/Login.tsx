import { useState } from "react";
import {
  Box,
  Button,
  Input,
  Heading,
  VStack,
  Text,
  Field,
  Center,
} from "@chakra-ui/react";

import { FiEye, FiEyeOff } from "react-icons/fi";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { useLoading } from "../context/LoadingContext";
import { useNavigate } from "react-router-dom";
import { ApiBaseUrl } from "../settings";

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { success, error } = useToast();
    const { showLoading, hideLoading } = useLoading();

  const [username, setusername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username || !password) {
      error({
        title: "Campos obrigatórios",
        description: "Preencha username e senha",
        duration: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      showLoading();

      const response = await fetch(`${ApiBaseUrl}/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Erro ao fazer login");
      }

      login(data.access, data.refresh);
      navigate("/painel");
      success({
        title: "Sucesso",
        description: "Login realizado com sucesso 🚀",
        duration: 3000,
      });
    } catch (err: any) {
      error({
        title: "Erro",
        description: err.message || "Erro inesperado",
        duration: 4000,
      });
    } finally {
      hideLoading();
      setLoading(false);
    }
  }

  return (
    <Center>
        <Box
      w="100%"
      maxW="400px"
      bg="white"
      p={8}
      borderRadius="2xl"
      boxShadow="lg"
    >
      <VStack gap={5} align="stretch">
        <Heading size="lg" textAlign="center">
          Entrar
        </Heading>

        <Text fontSize="sm" color="gray.500" textAlign="center">
          Acesse sua conta
        </Text>

        {/* username */}
        <Field.Root>
          <Field.Label>Usuário</Field.Label>
          <Input
            placeholder=""
            value={username}
            onChange={(e) => setusername(e.target.value)}
            _focusVisible={{ borderColor: "blue.500" }}
          />
        </Field.Root>

        {/* SENHA */}
        <Field.Root>
          <Field.Label>Senha</Field.Label>

          <Box position="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              pr="40px"
              _focusVisible={{ borderColor: "blue.500" }}
            />

            <Box
              position="absolute"
              right="10px"
              top="50%"
              transform="translateY(-50%)"
              cursor="pointer"
              color="gray.500"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </Box>
          </Box>
        </Field.Root>

        <Button
          colorPalette="blue"
          size="lg"
          w="100%"
          onClick={handleLogin}
          loading={loading}
        >
          Entrar
        </Button>
      </VStack>
    </Box>
    </Center>
  );
}
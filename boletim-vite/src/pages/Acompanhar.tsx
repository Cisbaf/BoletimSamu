import React from "react";
import {
  Flex,
  Text,
  Input,
  Center,
  Show,
  Box,
} from "@chakra-ui/react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import CardNewRequest from "../components/CardNewRequest";
import DocumentStatusDetail from "../components/DocumentStatusDetail";
import { useGet } from "../hooks/useGet";
import { useLoading } from "../context/LoadingContext";
import { useToast } from "../hooks/useToast";
import { ToCamelCase } from "../utils/camelCase";
import type { DocumentSimpleDetail } from "../domain/documentSimpleDetail";

const MotionBox = motion(Box);

// ─── Ícone de busca ───────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" stroke="#9CA3AF" strokeWidth="2" />
      <path d="m21 21-4.35-4.35" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ─── AcompanharSolicitacao ────────────────────────────────────────────────────

export default function AcompanharSolicitacao() {
  const [searchParams, setSearchParams] = useSearchParams();

  const protocolFromUrl = React.useMemo(
    () => (searchParams.get("protocol") ?? "").trim(),
    [searchParams]
  );

  const createdFromUrl = React.useMemo(
    () => searchParams.get("created") === "true",
    [searchParams]
  );

  const [searchInput, setSearchInput] = React.useState(protocolFromUrl);
  const [queryProtocol, setQueryProtocol] = React.useState(protocolFromUrl);
  const [showCreatedCard, setShowCreatedCard] = React.useState(createdFromUrl);
  const [hasSearched, setHasSearched] = React.useState(false);

  const { showLoading, hideLoading } = useLoading();
  const { error } = useToast();

  const { data, refetch, loading, error: err } = useGet({
    url: "/document/requests/",
    params: { protocol: queryProtocol },
    autoFetch: false,
    transform: ToCamelCase,
  });

  React.useEffect(() => {
    if (!data) return;
    const results = data.results;
    if (!Array.isArray(results) || results.length === 0) {
      setTimeout(() => { error({ title: "Nenhum registro encontrado!" }); }, 0);
    }
  }, [data, err]);

  React.useEffect(() => {
    if (!err) return;
    setTimeout(() => {
      error({ title: "Problema ao se conectar", description: err.message });
    }, 0);
  }, [err]);

  const request: DocumentSimpleDetail | null = React.useMemo(() => {
    if (data) {
      const results = data.results;
      if (!Array.isArray(results) || results.length === 0) return null;
      return results[0] as DocumentSimpleDetail;
    }
    return null;
  }, [data]);

  const notFound =
    hasSearched &&
    !loading &&
    data != null &&
    data?.results?.length === 0 &&
    queryProtocol.trim() !== "";

  function syncUrl(protocol: string, created?: boolean) {
    const next = new URLSearchParams(searchParams);
    const cleaned = protocol.trim();
    if (cleaned) next.set("protocol", cleaned);
    else next.delete("protocol");
    if (created !== undefined) {
      if (created) next.set("created", "true");
      else next.delete("created");
    }
    setSearchParams(next, { replace: true });
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearchInput(value);
    syncUrl(value);
  }

  function handleSearch(protocol?: string) {
    const cleaned = (protocol ?? searchInput).trim();
    if (!cleaned) {
      error({ title: "", description: "Digite um protocolo!" });
      return;
    }
    setHasSearched(true);
    setQueryProtocol(cleaned);
    syncUrl(cleaned);
  }

  function resetFlow() {
    setShowCreatedCard(false);
    syncUrl(searchInput, false);
  }

  React.useEffect(() => {
    if (protocolFromUrl) {
      setSearchInput(protocolFromUrl);
      setQueryProtocol(protocolFromUrl);
      setHasSearched(true);
    }
    setShowCreatedCard(createdFromUrl && Boolean(protocolFromUrl));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!queryProtocol.trim()) return;
    refetch();
  }, [queryProtocol, refetch]);

  React.useEffect(() => {
    if (loading) {
      showLoading(`Buscando por ${queryProtocol || searchInput}`);
    } else {
      hideLoading();
    }
    return () => hideLoading();
  }, [loading, queryProtocol, searchInput, showLoading, hideLoading]);

  return (
    <Center px={4} py={8}>
      {showCreatedCard ? (
        <CardNewRequest protocol={queryProtocol || protocolFromUrl} onClose={resetFlow} />
      ) : (
        <Flex direction="column" gap={5} w="full" maxW="680px">

          {/* ── Card de busca ──────────────────────────────────────── */}
          <MotionBox
            bg="white"
            borderRadius="2xl"
            boxShadow="0 1px 3px rgba(0,0,0,0.05), 0 4px 24px rgba(0,0,0,0.07)"
            overflow="hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header do card */}
            <Box px={6} pt={6} pb={5} borderBottom="1px solid #F3F4F6">
              <Flex align="center" gap={3} mb={1}>
                <Box
                  w="32px"
                  h="32px"
                  bg="#EFF6FF"
                  borderRadius="8px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="7" stroke="#2563EB" strokeWidth="2" />
                    <path d="m21 21-4.35-4.35" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </Box>
                <Text fontSize="17px" fontWeight="800" color="#111827" letterSpacing="-0.3px">
                  Acompanhar Solicitação
                </Text>
              </Flex>
              <Text fontSize="13px" color="#6B7280" pl="44px">
                Consulte o status e os detalhes da sua solicitação.
              </Text>
            </Box>

            {/* Campo de busca */}
            <Box px={6} py={6}>
              <Text fontSize="12px" fontWeight="600" color="#374151" mb={2}>
                Código do Protocolo
              </Text>

              <Flex gap={3}>
                {/* Input com ícone */}
                <Box flex={1} position="relative">
                  <Box
                    position="absolute"
                    left="12px"
                    top="50%"
                    transform="translateY(-50%)"
                    pointerEvents="none"
                    zIndex={1}
                  >
                    <SearchIcon />
                  </Box>
                  <Input
                    placeholder="Ex: 2026-0046"
                    value={searchInput}
                    onChange={handleInputChange}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                    pl="40px"
                    h="44px"
                    bg="#F9FAFB"
                    border="1px solid #E5E7EB"
                    borderRadius="12px"
                    fontSize="14px"
                    fontFamily="mono"
                    color="#111827"
                    fontWeight="600"
                    letterSpacing="0.5px"
                    _focus={{ borderColor: "#2563EB", bg: "white", boxShadow: "0 0 0 3px rgba(37,99,235,0.12)" }}
                    _placeholder={{ color: "#9CA3AF", fontWeight: "400", fontFamily: "sans-serif", letterSpacing: "normal" }}
                  />
                </Box>

                {/* Botão buscar */}
                <Box
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSearch()}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                  display="flex"
                  alignItems="center"
                  gap={2}
                  px={5}
                  h="44px"
                  bg={loading ? "#3B82F6" : "#2563EB"}
                  color="white"
                  borderRadius="12px"
                  fontWeight="700"
                  fontSize="14px"
                  cursor={loading ? "not-allowed" : "pointer"}
                  boxShadow="0 2px 8px rgba(37,99,235,0.28)"
                  transition="all 0.15s"
                  _hover={{ bg: "#1D4ED8" }}
                  flexShrink={0}
                  whiteSpace="nowrap"
                >
                  {loading ? "Buscando..." : "Buscar"}
                </Box>
              </Flex>

              <Text fontSize="12px" color="#9CA3AF" mt={2}>
                Use o protocolo gerado no momento da solicitação.
              </Text>
            </Box>
          </MotionBox>

          {/* ── Não encontrado ─────────────────────────────────────── */}
          <Show when={notFound}>
            <MotionBox
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              p={4}
              bg="white"
              borderRadius="xl"
              border="1px solid #FECACA"
              borderLeft="3px solid #EF4444"
            >
              <Text fontSize="13px" fontWeight="600" color="#991B1B">
                Nenhuma solicitação encontrada para o protocolo informado.
              </Text>
              <Text fontSize="12px" color="#9CA3AF" mt={1}>
                Verifique o número e tente novamente.
              </Text>
            </MotionBox>
          </Show>

          {/* ── Resultado ──────────────────────────────────────────── */}
          {request != null && (
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <DocumentStatusDetail data={request} />
            </MotionBox>
          )}

        </Flex>
      )}
    </Center>
  );
}

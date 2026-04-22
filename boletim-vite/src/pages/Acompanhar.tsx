import React from "react";
import {
  Flex,
  Text,
  Field,
  Input,
  Button,
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

const MotionFlex = motion(Flex);

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
      setTimeout(() => {
        error({ title: "Nenhum registro encontrado!" });
      }, 0);
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
    } else return null;

  }, [data]);

  const notFound =
    hasSearched &&
    !loading &&
    Array.isArray(data) &&
    data.length === 0 &&
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

    // mantém o protocolo na URL enquanto o usuário digita
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

    // a busca real acontece no effect abaixo, após queryProtocol mudar
  }

  function resetFlow() {
    setShowCreatedCard(false);
    syncUrl(searchInput, false); // remove created da URL e mantém o protocolo
  }

  // Primeiro carregamento: lê a URL, preenche o input,
  // mostra o card de criação se existir, e dispara busca se houver protocolo.
  React.useEffect(() => {
    if (protocolFromUrl) {
      setSearchInput(protocolFromUrl);
      setQueryProtocol(protocolFromUrl);
      setHasSearched(true);
    }

    setShowCreatedCard(createdFromUrl && Boolean(protocolFromUrl));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toda vez que queryProtocol mudar, faz a busca na API.
  React.useEffect(() => {
    if (!queryProtocol.trim()) return;
    refetch();
  }, [queryProtocol, refetch]);

  // Loading global
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
        <Flex direction="column" gap={5} w="full" maxW="760px">
          <MotionFlex
            direction="column"
            w="full"
            gap={5}
            p={8}
            bg="white"
            borderRadius="2xl"
            boxShadow="lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Box>
              <Text fontSize="3xl" fontWeight="bold">
                Acompanhar Solicitação
              </Text>
              <Text color="gray.500" mt={2}>
                Consulte o status e os detalhes da sua solicitação.
              </Text>
            </Box>

            <Field.Root required>
              <Field.Label>
                Código Protocolo
                <Field.RequiredIndicator />
              </Field.Label>

              <Input
                placeholder="Digite o protocolo ex: 2026-0046"
                size="lg"
                value={searchInput}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                _focus={{
                  borderColor: "blue.400",
                  boxShadow: "0 0 0 1px #3182ce",
                }}
              />

              <Field.HelperText>
                Use o protocolo gerado na solicitação
              </Field.HelperText>
            </Field.Root>

            <Button
              colorScheme="blue"
              size="lg"
              onClick={() => handleSearch()}
            >
              Buscar
            </Button>
          </MotionFlex>

          <Show when={notFound}>
            <Box
              p={5}
              bg="white"
              borderRadius="xl"
              boxShadow="sm"
              borderWidth="1px"
            >
              <Text fontWeight="semibold" color="red.500">
                Nenhuma solicitação foi encontrada para esse protocolo.
              </Text>
            </Box>
          </Show>

          {request != null && (
            <MotionFlex
                direction={"column"}
                w="full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}>
                <DocumentStatusDetail data={request} />
            </MotionFlex>
            )}
        </Flex>
      )}
    </Center>
  );
}
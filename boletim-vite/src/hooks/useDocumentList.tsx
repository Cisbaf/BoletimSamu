import React from "react";
import type { DocumentSimpleDetail } from "../domain/documentSimpleDetail";
import type { Status } from "../domain/documentDetail";

export default function useDocumentList() {
  const [documents, setDocuments] = React.useState<DocumentSimpleDetail[]>([]);

  // 🔹 Definir lista inteira (ex: vindo da API)
  const setAll = React.useCallback((docs: DocumentSimpleDetail[]) => {
    docs.forEach(doc=>doc.view = true);
    setDocuments(docs);
  }, []);

  // 🔹 Adicionar um documento
  const add = React.useCallback((doc: DocumentSimpleDetail) => {
    doc.view = true;
    setDocuments((prev) => [doc, ...prev]);
  }, []);

  // 🔹 Buscar por ID 
  const getById = React.useCallback((id: string | number) => {
    return documents.find((doc) => doc.id === id);
  }, [documents]);

    // 🔹 Buscar por Protocolo
  const getByProtocol = React.useCallback((protocol: string | number) => {
    return documents.find((doc) => doc.protocol === protocol);
  }, [documents]);

  // 🔹 Atualizar documento
  const update = React.useCallback((updatedDoc: DocumentSimpleDetail) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === updatedDoc.id ? updatedDoc : doc
      )
    );
  }, []);

  // 🔹 Remover documento
  const remove = React.useCallback((id: string | number) => {
    setDocuments((prev) =>
      prev.filter((doc) => doc.id !== id)
    );
  }, []);

  // 🔹 Limpar lista
  const clear = React.useCallback(() => {
    setDocuments([]);
  }, []);

  const addStatus = React.useCallback(
    (id: number, newStatus: Status) => {
      setDocuments((prevDocs) =>
        prevDocs.map((doc) => {
          if (doc.id !== id) return doc;

          return {
            ...doc,
            status: [...(doc.status ?? []), newStatus],
          };
        })
      );
    },
    []
  );

  const getLastStatus = React.useCallback((id: number) => {
      const doc = documents.find((doc) => doc.id === id);
      if (!doc || doc.status.length === 0) return undefined;

      return doc.status[doc.status.length - 1];
  }, [documents]);

  return {
    documents,
    setAll,
    add,
    getById,
    getByProtocol,
    update,
    remove,
    clear,
    addStatus,
    getLastStatus,
  };
}
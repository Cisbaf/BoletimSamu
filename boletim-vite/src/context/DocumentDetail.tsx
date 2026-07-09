import React from "react";
import type { DocumentDetail, RectificationStatusValue } from "../domain/documentDetail";
import { ToCamelCase } from "../utils/camelCase";
import { useGetAuth } from "../hooks/useGetAuth";
import { usePostAuth } from "../hooks/usePostAuth";
import type useDocumentList from "../hooks/useDocumentList";
import { useLoading } from "./LoadingContext";
import { useToast } from "../hooks/useToast";
import { ApiBaseUrl } from "../settings";

interface DocumentDetailType {
    document: DocumentDetail | undefined;
    updateForProtocol: (protocol: string) => void;
    newStatus: (type: "confirmado" | "cancelado", comment: string) => Promise<any>;
    newRectificationStatus: (rectificationId: number, type: RectificationStatusValue, comment: string) => Promise<any>;
    refetch: () => void;
}

interface DocumentDetailProps {
    children: any;
    useDocumentList: ReturnType<typeof useDocumentList>;
    removedForNewStatus?: boolean;
    /** Chamado após um novo status (documento ou retificação) ser registrado com sucesso. */
    onChanged?: () => void;
}

const DocumentDetailContext = React.createContext<DocumentDetailType | null>(null);

export function DocumentDetailProvider({ children, useDocumentList, removedForNewStatus, onChanged } : DocumentDetailProps) {
    const [document, setDocument] = React.useState<DocumentDetail>();
    const [protocol, setProtocol] = React.useState("");
    const { showLoading, hideLoading } = useLoading();
    const { success, error: err } = useToast();

    const { data, refetch } = useGetAuth({
        url: `${ApiBaseUrl}/document/admin/requests/${protocol}/`,
        autoFetch: !!protocol,
        transform: ToCamelCase,
    });

    const { post, loading } = usePostAuth({
        url: `${ApiBaseUrl}/document/status/`,
        onError(error) {
            err({ title: "Erro ao conectar-se", description: error.message})
            hideLoading();
        }
    });

    const { post: postRectificationStatus, loading: rectificationLoading } = usePostAuth({
        url: `${ApiBaseUrl}/document/rectifications/status/`,
        onError(error) {
            err({ title: "Erro ao conectar-se", description: error.message})
            hideLoading();
        }
    });

    const newStatus = async(type: "confirmado" | "cancelado", comment: string) => {
        showLoading("Registrando novo status...");
        const response = await post({
            "status": type,
            "document": document!.id,
            "comment": comment
        })

        if (!response) return hideLoading();

        const docID = response.document;
        const lastStatus = useDocumentList.getLastStatus(docID);
        if (!docID || !lastStatus) return;
        useDocumentList.addStatus(docID, response);

        if (removedForNewStatus) {
            const doc = useDocumentList.getById(docID);
            if (doc) {
                doc.view = false;
                useDocumentList.update(doc);
            }
        }
        success({ title: "Novo status registrado!"});
        hideLoading();
        refetch();
        onChanged?.();
        return response;
    }

    const newRectificationStatus = async(rectificationId: number, type: RectificationStatusValue, comment: string) => {
        showLoading("Registrando status da retificação...");
        const docID = document?.id;
        const response = await postRectificationStatus({
            "status": type,
            "rectification": rectificationId,
            "comment": comment
        })

        if (!response) return hideLoading();

        const isTerminal = type === "concluida" || type === "cancelada";
        if (removedForNewStatus && docID && isTerminal) {
            const doc = useDocumentList.getById(docID);
            if (doc) {
                doc.view = false;
                useDocumentList.update(doc);
            }
        }

        success({ title: "Status da retificação atualizado!"});
        hideLoading();
        refetch();
        onChanged?.();
        return response;
    }

    React.useEffect(()=>{
        if (data) setDocument(data);
    }, [data]);

    React.useEffect(()=>{
        if (loading || rectificationLoading) refetch();
    }, [loading, rectificationLoading]);

    React.useEffect(()=>{
        if(protocol) refetch();
        setDocument(undefined);
    }, [protocol])
    
    return (
        <DocumentDetailContext.Provider value={{
            document,
            refetch,
            updateForProtocol(protocol) { setProtocol(protocol) },
            newStatus,
            newRectificationStatus
        }}>
            {children}
        </DocumentDetailContext.Provider>
    )
}

export function useDocumentDetailContext() {
    const context = React.useContext(DocumentDetailContext);
    if (!context) {
      throw new Error("DocumentDetailContext must be used within a DocumentDetailProvider");
    }
  return context;
}
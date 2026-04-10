import React from "react";
import type { DocumentDetail } from "../domain/documentDetail";
import { ToCamelCase } from "../utils/camelCase";
import { useGetAuth } from "../hooks/useGetAuth";
import { usePostAuth } from "../hooks/usePostAuth";
import type useDocumentList from "../hooks/useDocumentList";
import { useLoading } from "./LoadingContext";
import { useToast } from "../hooks/useToast";


interface DocumentDetailType {
    document: DocumentDetail | undefined;
    updateForProtocol: (protocol: string) => void;
    newStatus: (type: "confirmado" | "cancelado", comment: string) => Promise<any>;
    refetch: () => void;
}

interface DocumentDetailProps {
    children: any;
    useDocumentList: ReturnType<typeof useDocumentList>;
    removedForNewStatus?: boolean;
}

const DocumentDetailContext = React.createContext<DocumentDetailType | null>(null);

export function DocumentDetailProvider({ children, useDocumentList, removedForNewStatus } : DocumentDetailProps) {
    const [document, setDocument] = React.useState<DocumentDetail>();
    const [protocol, setProtocol] = React.useState("");
    const { showLoading, hideLoading } = useLoading();
    const { success, error: err } = useToast();

    const { data, refetch } = useGetAuth({
        url: `/document/admin/requests/${protocol}/`,
        autoFetch: !!protocol,
        transform: ToCamelCase,
    });
        
    const { post, loading } = usePostAuth({
        url: "/document/status/",
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

        if (!response) return;

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
        return response;
    }

    React.useEffect(()=>{
        if (data) setDocument(data);
    }, [data]);

    React.useEffect(()=>{
        if (loading) refetch();
    }, [loading]);

    React.useEffect(()=>{
        if(protocol) refetch();
        setDocument(undefined);
    }, [protocol])
    
    return (
        <DocumentDetailContext.Provider value={{
            document,
            refetch,
            updateForProtocol(protocol) { setProtocol(protocol) },
            newStatus
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
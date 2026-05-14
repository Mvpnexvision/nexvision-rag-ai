"use client";

import { useFetch } from "@/hooks/useFetch";

export interface UploadDocumentResponse {
  document_id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  processing_status: string;
  message: string;
}

export interface LinkDocumentsResponse {
  chat_id: string;
  linked_document_ids: string[];
}

export interface DocumentStatusResponse {
  document_id: string;
  file_name: string;
  processing_status: string;
}

export interface AIOutput {
  direct_answer: string;
  evidence_found: string[];
  reasoning: string;
  recommendation: string;
  risk_level: "Low" | "Medium" | "High" | "Critical";
  business_impact: string;
  next_action: string;
  missing_data: string[];
  sources: string[];
}

export interface AIChatResponse {
  question_id: string;
  chat_id: string;
  question: string;
  company_id: string;
  user_id: string;
  answer: AIOutput;
  has_insight: boolean;
  recommendation_id: string | null;
  chunks_used: number;
}

interface UseChatWorkflowApiReturn {
  loading: boolean;
  error: string | null;
  uploadDocument: (params: {
    file: File;
    companyId: string;
    uploadedBy: string;
    tags?: string[];
  }) => Promise<UploadDocumentResponse>;
  linkDocumentsToChat: (params: {
    chatId: string;
    documentIds: string[];
  }) => Promise<LinkDocumentsResponse>;
  processDocument: (documentId: string) => Promise<unknown>;
  getDocumentStatus: (documentId: string) => Promise<DocumentStatusResponse>;
  sendAIChat: (params: {
    chatId: string;
    companyId: string;
    userId: string;
    question: string;
  }) => Promise<AIChatResponse>;
}

export function useChatWorkflowApi(): UseChatWorkflowApiReturn {
  const { loading, error, get, post } = useFetch({ auth: true });

  const uploadDocument = async ({
    file,
    companyId,
    uploadedBy,
    tags = [],
  }: {
    file: File;
    companyId: string;
    uploadedBy: string;
    tags?: string[];
  }): Promise<UploadDocumentResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("company_id", companyId);
    formData.append("uploaded_by", uploadedBy);
    formData.append("tags", tags.join(","));

    return post<UploadDocumentResponse>("/documents/upload", formData, {
      headers: {
        "Content-Type": undefined,
      },
    });
  };

  const linkDocumentsToChat = async ({
    chatId,
    documentIds,
  }: {
    chatId: string;
    documentIds: string[];
  }): Promise<LinkDocumentsResponse> => {
    return post<LinkDocumentsResponse>(`/insights/chat/${chatId}/documents/link`, {
      document_ids: documentIds,
    });
  };

  const processDocument = async (documentId: string): Promise<unknown> => {
    return post(`/documents/${documentId}/process`);
  };

  const getDocumentStatus = async (documentId: string): Promise<DocumentStatusResponse> => {
    return get<DocumentStatusResponse>(`/documents/${documentId}/status`);
  };

  const sendAIChat = async ({
    chatId,
    companyId,
    userId,
    question,
  }: {
    chatId: string;
    companyId: string;
    userId: string;
    question: string;
  }): Promise<AIChatResponse> => {
    return post<AIChatResponse>("/insights/ai/chat", {
      chat_id: chatId,
      company_id: companyId,
      user_id: userId,
      question,
    });
  };

  return {
    loading,
    error,
    uploadDocument,
    linkDocumentsToChat,
    processDocument,
    getDocumentStatus,
    sendAIChat,
  };
}

"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { DocumentHistoryModal } from "@/components/history/DocumentHistoryModal";

interface DocumentHistoryContextType {
  isOpen: boolean;
  openHistory: () => void;
  closeHistory: () => void;
}

const DocumentHistoryContext = createContext<
  DocumentHistoryContextType | undefined
>(undefined);

export function useDocumentHistory() {
  const context = useContext(DocumentHistoryContext);
  if (!context) {
    throw new Error(
      "useDocumentHistory must be used within DocumentHistoryProvider"
    );
  }
  return context;
}

export function DocumentHistoryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const openHistory = () => setIsOpen(true);
  const closeHistory = () => setIsOpen(false);

  return (
    <DocumentHistoryContext.Provider
      value={{ isOpen, openHistory, closeHistory }}
    >
      {children}
      <DocumentHistoryModal isOpen={isOpen} onClose={closeHistory} />
    </DocumentHistoryContext.Provider>
  );
}

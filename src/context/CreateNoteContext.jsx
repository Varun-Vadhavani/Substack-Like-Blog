"use client";

import React, { createContext, useContext, useState } from "react";

const CreateNoteContext = createContext();

export const CreateNoteProvider = ({ children }) => {
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  const openNoteModal = () => setIsNoteModalOpen(true);
  const closeNoteModal = () => setIsNoteModalOpen(false);

  return (
    <CreateNoteContext.Provider
      value={{
        isNoteModalOpen,
        openNoteModal,
        closeNoteModal,
      }}
    >
      {children}
    </CreateNoteContext.Provider>
  );
};

export const useCreateNote = () => {
  const context = useContext(CreateNoteContext);
  if (!context) {
    throw new Error("useCreateNote must be used within a CreateNoteProvider");
  }
  return context;
};

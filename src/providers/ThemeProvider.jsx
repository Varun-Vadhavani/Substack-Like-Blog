"use client";

import { ThemeContext } from "@/context/ThemeContext";
import { useContext, useEffect, useState } from "react";
import React from "react";

const ThemeProvider = ({ children }) => {
  const { theme } = useContext(ThemeContext);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="light">{children}</div>;
  }

  return <div className={theme}>{children}</div>;
};

export default ThemeProvider;
"use client"

import { createContext, useEffect } from "react"
import { useState } from "react"

export const ThemeContext = createContext()

const getFromLocalStorage = () => {
    const value = localStorage.getItem("theme")
    return value || "light"
}

export const ThemeContextProvider = ({ children }) => {
    const [theme, setTheme] = useState(getFromLocalStorage())

    const toggle = () => {
        setTheme(theme === "light" ? "dark" : "light")
    }

    useEffect(() => {
        localStorage.setItem("theme", theme)
    }, [theme])

    return <ThemeContext.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeContext.Provider>
}
"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

type Store = {
  id: string
  name: string
}

type StoreContextType = {
  store: Store | null
  setStore: (store: Store | null) => void
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store, setStoreState] = useState<Store | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("active_store")
    if (saved) {
      setStoreState(JSON.parse(saved))
    }
  }, [])

  function setStore(store: Store | null) {
    setStoreState(store)

    if (store) {
      localStorage.setItem("active_store", JSON.stringify(store))
    } else {
      localStorage.removeItem("active_store")
    }
  }

  return (
    <StoreContext.Provider value={{ store, setStore }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error("useStore must be used within StoreProvider")
  }
  return context
}

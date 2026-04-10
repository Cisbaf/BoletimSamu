"use client"

import { toaster } from "../components/Toaster"

interface ToastOptions {
  title?: string
  description?: string
  duration?: number
}

export function useToast() {

  const success = ({ title, description, duration = 5000 }: ToastOptions) => {
    toaster.create({
      type: "success",
      title,
      description,
      duration,
      closable: true
    })
  }

  const error = ({ title = "Erro", description, duration = 5000 }: ToastOptions) => {
    toaster.create({
      type: "error",
      title,
      description,
      duration,
      closable: true
    })
  }

  const info = ({ title, description, duration = 5000 }: ToastOptions) => {
    toaster.create({
      type: "info",
      title,
      description,
      duration,
      closable: true
    })
  }


  const close = (id: string) => {
    toaster.dismiss(id)
  }

  return {
    success,
    error,
    info,
    close
  }
}
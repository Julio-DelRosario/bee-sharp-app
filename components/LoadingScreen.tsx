"use client"

export default function LoadingScreen() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-t-transparent border-slate-900"></div>
        <p className="mt-4 text-sm text-slate-600">Generating…</p>
      </div>
    </div>
  )
}

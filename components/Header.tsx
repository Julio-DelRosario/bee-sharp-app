"use client"

import Image from "next/image";

export default function Header() {
    return (
        <header className="w-full bg-[#FEFCF6] border-b border-slate-200 p-3">
          <div className="max-w-6xl mx-auto flex items-center justify-start gap-3 px-6">
            <Image src="/logo.svg" alt="Bee Sharp Logo" width={40} height={40} />
            <div className="text-base font-semibold tracking-tight">Bee Sharp</div>
          </div>
        </header>
    )
}
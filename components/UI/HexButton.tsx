"use client";

import React from "react";

interface HexButtonProps {
  label?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  selected?: boolean;
  icon?: React.ReactNode;
}

export default function HexButton({ label, children, onClick, className, selected, icon }: HexButtonProps) {
  const baseClasses =
    "relative cursor-pointer w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 flex items-center justify-center text-[0.8rem] sm:text-sm font-semibold text-[#7a5a12] shadow-lg shadow-[rgba(191,133,34,0.35)] transition-transform transition-shadow duration-200 ease-out hover:scale-105 hover:shadow-xl hover:shadow-[rgba(191,133,34,0.5)] hover:brightness-105 active:scale-95 active:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#f2b63e] focus-visible:ring-offset-[#fffaf0] p-[4px] [clip-path:polygon(50%_0%,95%_25%,95%_75%,50%_100%,5%_75%,5%_25%)]";

  const baseColorClasses = selected ? " bg-[#A65422]" : " bg-[#f9c44d]/90";

  const content = label ?? children;
  const innerHexBaseClasses =
    "flex items-center justify-center w-full h-full transition-colors duration-150 [clip-path:polygon(50%_0%,95%_25%,95%_75%,50%_100%,5%_75%,5%_25%)]";

  const innerHexStateClass = selected
    ? " bg-[#f9c44d]"
    : " bg-white hover:bg-[#fde39a]";

  const iconColorClass = selected ? "text-[#A65422]" : "text-[#f9c44d]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={className ? `${baseClasses}${baseColorClasses} ${className}` : `${baseClasses}${baseColorClasses}`}
    >
      <div
        className={`${innerHexBaseClasses}${innerHexStateClass}`}
      >
        <span className="flex flex-col items-center justify-center px-2 text-center leading-snug gap-1">
          {icon && <span className={iconColorClass}>{icon}</span>}
          {content}
        </span>
      </div>
    </button>
  );
}

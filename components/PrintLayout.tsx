"use client";

import React, { ReactNode, CSSProperties } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

interface PrintLayoutProps {
  markdownContent: string;
  title?: string;
}

// Type helper for component props
type ChildrenProps = { children?: ReactNode };
type CodeProps = { className?: string; children?: ReactNode };
type LinkProps = { href?: string; children?: ReactNode };

// Color palette using hex values (html2canvas compatible)
const colors = {
  white: "#ffffff",
  black: "#000000",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray700: "#374151",
  gray800: "#1f2937",
  gray900: "#111827",
  amber50: "#fffbeb",
  amber200: "#fde68a",
  amber300: "#fcd34d",
  amber600: "#d97706",
  amber700: "#b45309",
};

/**
 * PrintLayout - A hidden off-screen component for PDF export
 * 
 * Uses inline styles with hex colors to ensure html2canvas compatibility.
 * Tailwind CSS v4 uses lab()/oklch() colors which html2canvas cannot parse.
 */
export function PrintLayout({ markdownContent, title }: PrintLayoutProps) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Inline styles for html2canvas compatibility
  const containerStyle: CSSProperties = {
    position: "absolute",
    left: "-9999px",
    top: 0,
    width: "800px",
    backgroundColor: colors.white,
    fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
  };

  const wrapperStyle: CSSProperties = {
    padding: "48px",
  };

  const headerStyle: CSSProperties = {
    marginBottom: "32px",
    paddingBottom: "24px",
    borderBottom: `2px solid ${colors.amber200}`,
  };

  const headerFlexStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "8px",
  };

  const titleStyle: CSSProperties = {
    fontSize: "24px",
    fontWeight: "bold",
    color: colors.amber700,
    letterSpacing: "-0.025em",
    margin: 0,
  };

  const subtitleStyle: CSSProperties = {
    fontSize: "12px",
    color: colors.gray500,
    marginTop: "-2px",
  };

  const docTitleStyle: CSSProperties = {
    fontSize: "18px",
    fontWeight: 600,
    color: colors.gray800,
    marginTop: "16px",
    marginBottom: "4px",
  };

  const dateStyle: CSSProperties = {
    fontSize: "14px",
    color: colors.gray400,
    fontStyle: "italic",
  };

  const mainStyle: CSSProperties = {
    color: colors.black,
    maxWidth: "none",
  };

  const footerStyle: CSSProperties = {
    marginTop: "48px",
    paddingTop: "24px",
    borderTop: `1px solid ${colors.gray200}`,
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    color: colors.gray400,
  };

  return (
    <div id="pdf-export-container" style={containerStyle}>
      <div style={wrapperStyle}>
        {/* Branded Header */}
        <header style={headerStyle}>
          <div style={headerFlexStyle}>
            {/* Logo */}
            <img
              src="/logo.svg"
              alt="Bee Sharp Logo"
              width={48}
              height={48}
              style={{ flexShrink: 0 }}
            />
            <div>
              <h1 style={titleStyle}>Bee Sharp</h1>
              <p style={subtitleStyle}>AI Study Assistant</p>
            </div>
          </div>
          {title && <h2 style={docTitleStyle}>{title}</h2>}
          <p style={dateStyle}>Generated on {currentDate}</p>
        </header>

        {/* Markdown Content */}
        <main style={mainStyle}>
          <ReactMarkdown
            components={{
              h1: ({ children }: ChildrenProps) => (
                <h1 style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: colors.gray900,
                  marginTop: "32px",
                  marginBottom: "16px",
                  paddingBottom: "8px",
                  borderBottom: `1px solid ${colors.gray200}`,
                }}>
                  {children}
                </h1>
              ),
              h2: ({ children }: ChildrenProps) => (
                <h2 style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: colors.gray800,
                  marginTop: "24px",
                  marginBottom: "12px",
                }}>
                  {children}
                </h2>
              ),
              h3: ({ children }: ChildrenProps) => (
                <h3 style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: colors.gray700,
                  marginTop: "20px",
                  marginBottom: "8px",
                }}>
                  {children}
                </h3>
              ),
              h4: ({ children }: ChildrenProps) => (
                <h4 style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: colors.gray700,
                  marginTop: "16px",
                  marginBottom: "8px",
                }}>
                  {children}
                </h4>
              ),
              p: ({ children }: ChildrenProps) => (
                <p style={{
                  fontSize: "14px",
                  lineHeight: 1.7,
                  color: colors.gray800,
                  marginBottom: "12px",
                }}>
                  {children}
                </p>
              ),
              ul: ({ children }: ChildrenProps) => (
                <ul style={{
                  listStyleType: "disc",
                  listStylePosition: "outside",
                  marginLeft: "20px",
                  marginBottom: "16px",
                  fontSize: "14px",
                  color: colors.gray800,
                }}>
                  {children}
                </ul>
              ),
              ol: ({ children }: ChildrenProps) => (
                <ol style={{
                  listStyleType: "decimal",
                  listStylePosition: "outside",
                  marginLeft: "20px",
                  marginBottom: "16px",
                  fontSize: "14px",
                  color: colors.gray800,
                }}>
                  {children}
                </ol>
              ),
              li: ({ children }: ChildrenProps) => (
                <li style={{
                  lineHeight: 1.7,
                  paddingLeft: "4px",
                  marginBottom: "4px",
                }}>
                  {children}
                </li>
              ),
              strong: ({ children }: ChildrenProps) => (
                <strong style={{ fontWeight: "bold", color: colors.gray900 }}>
                  {children}
                </strong>
              ),
              em: ({ children }: ChildrenProps) => (
                <em style={{ fontStyle: "italic", color: colors.gray700 }}>
                  {children}
                </em>
              ),
              code: ({ className, children }: CodeProps) => {
                const isInline = !className;
                if (isInline) {
                  return (
                    <code style={{
                      backgroundColor: colors.gray100,
                      color: colors.gray800,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontFamily: "Consolas, Monaco, 'Courier New', monospace",
                    }}>
                      {children}
                    </code>
                  );
                }
                return (
                  <code style={{
                    display: "block",
                    backgroundColor: colors.gray50,
                    padding: "12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontFamily: "Consolas, Monaco, 'Courier New', monospace",
                    overflowX: "auto",
                    border: `1px solid ${colors.gray200}`,
                  }}>
                    {children}
                  </code>
                );
              },
              pre: ({ children }: ChildrenProps) => (
                <pre style={{
                  backgroundColor: colors.gray50,
                  padding: "16px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontFamily: "Consolas, Monaco, 'Courier New', monospace",
                  overflowX: "auto",
                  marginBottom: "16px",
                  border: `1px solid ${colors.gray200}`,
                }}>
                  {children}
                </pre>
              ),
              blockquote: ({ children }: ChildrenProps) => (
                <blockquote style={{
                  borderLeft: `4px solid ${colors.amber300}`,
                  paddingLeft: "16px",
                  paddingTop: "4px",
                  paddingBottom: "4px",
                  margin: "16px 0",
                  backgroundColor: colors.amber50,
                  borderRadius: "0 8px 8px 0",
                  color: colors.gray700,
                  fontStyle: "italic",
                }}>
                  {children}
                </blockquote>
              ),
              hr: () => (
                <hr style={{
                  margin: "24px 0",
                  border: "none",
                  borderTop: `2px solid ${colors.gray200}`,
                }} />
              ),
              a: ({ href, children }: LinkProps) => (
                <a href={href} style={{
                  color: colors.amber600,
                  textDecoration: "underline",
                }}>
                  {children}
                </a>
              ),
              table: ({ children }: ChildrenProps) => (
                <table style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginBottom: "16px",
                  fontSize: "14px",
                }}>
                  {children}
                </table>
              ),
              thead: ({ children }: ChildrenProps) => (
                <thead style={{ backgroundColor: colors.gray100 }}>
                  {children}
                </thead>
              ),
              th: ({ children }: ChildrenProps) => (
                <th style={{
                  border: `1px solid ${colors.gray300}`,
                  padding: "8px 12px",
                  textAlign: "left",
                  fontWeight: 600,
                  color: colors.gray800,
                }}>
                  {children}
                </th>
              ),
              td: ({ children }: ChildrenProps) => (
                <td style={{
                  border: `1px solid ${colors.gray300}`,
                  padding: "8px 12px",
                  color: colors.gray700,
                }}>
                  {children}
                </td>
              ),
            } as Components}
            rehypePlugins={[rehypeSanitize]}
          >
            {markdownContent}
          </ReactMarkdown>
        </main>

        {/* Footer */}
        <footer style={footerStyle}>
          <span>Created with Bee Sharp - Your AI Study Assistant</span>
          <span>beesharp.app</span>
        </footer>
      </div>
    </div>
  );
}

export default PrintLayout;

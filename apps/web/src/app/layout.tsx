import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryProvider>

        <Toaster position="top-center" />
      </body>
    </html>
  );
}

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./providers/ThemeProvider";
import { AuthContextWrapper } from "./providers/AuthContextWrapper";
import { I18nextProvider } from "react-i18next";
import i18n from "./lib/i18n";

// Keep provider structure simple to fix authentication issues
createRoot(document.getElementById("root")!).render(
  <I18nextProvider i18n={i18n}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthContextWrapper>
          <App />
        </AuthContextWrapper>
      </ThemeProvider>
    </QueryClientProvider>
  </I18nextProvider>
);

"use client";

import * as React from "react";
import { CssBaseline, StyledEngineProvider } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: { mode: "light" ,
    primary: {
      main: "#8b5cf6",
      light: "#a78bfa",
      dark: "#7c3aed",
      contrastText: "#f8f8f8",
    },
    info: {
      main: "#00bc7d",      
    },

  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
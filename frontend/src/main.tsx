import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import App from "./App";
import Vitrina from "./pages/Vitrina";
import { ConfirmProvider } from "./ui/confirm";
import "./panel.css";
import "./admin.css";
import "./vitrina.css";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfirmProvider>
        <Routes>
          <Route path="/v/:slug" element={<Vitrina />} />
          <Route path="*" element={<App />} />
        </Routes>
      </ConfirmProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

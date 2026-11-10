import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import LimiteDeErro from "./components/LimiteDeErro";

// Acha a <div id="root"> do index.html, que é onde o React desenha o site
const raiz = document.getElementById("root");
if (raiz === null) {
    throw new Error('Não encontrei o elemento <div id="root"> no index.html.');
}

createRoot(raiz).render(
    <StrictMode>
        <LimiteDeErro>
            <App />
        </LimiteDeErro>
    </StrictMode>
);

import type { ChangeEvent } from "react";

// Props = as "informações" que quem usa o componente precisa passar pra ele
interface CampoTextoProps {
    id: string; // liga o texto (label) à caixinha (input)
    rotulo: string; // o texto que aparece em cima da caixinha
    valor: string; // o que está escrito agora
    aoMudar: (novoValor: string) => void; // função chamada quando a pessoa digita
    tipo?: "text" | "email" | "password"; // o "?" = opcional (se não passar, vira "text")
    placeholder?: string; // dica cinza dentro da caixinha
    erro?: string; // mensagem de erro (vazia = sem erro)
}

// Componente genérico: serve pra qualquer campo de texto do site
export default function CampoTexto({
    id,
    rotulo,
    valor,
    aoMudar,
    tipo = "text",
    placeholder,
    erro,
}: CampoTextoProps) {
    // Quando a pessoa digita, avisa quem usa o componente com o texto novo
    function tratarMudanca(evento: ChangeEvent<HTMLInputElement>) {
        aoMudar(evento.target.value);
    }

    return (
        <div className="campo">
            <label htmlFor={id}>{rotulo}</label>
            <input
                id={id}
                type={tipo}
                value={valor}
                placeholder={placeholder}
                onChange={tratarMudanca}
                aria-invalid={erro ? true : undefined} // avisa leitores de tela que tem erro
            />
            {/* Só mostra a mensagem se existir erro */}
            {erro && (
                <span className="campo-erro" role="alert">
                    {erro}
                </span>
            )}
        </div>
    );
}
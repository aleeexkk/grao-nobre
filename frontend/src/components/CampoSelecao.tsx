import type { ChangeEvent } from "react";

// Uma opção da lista (ex: valor "3" aparece como "Doces")
export interface OpcaoSelecao {
    valor: string;
    rotulo: string;
}

interface CampoSelecaoProps {
    id: string;
    rotulo: string;
    valor: string; // valor da opção escolhida ("" = nenhuma)
    opcoes: OpcaoSelecao[];
    aoMudar: (novoValor: string) => void;
    textoVazio?: string; // texto da primeira opção, que representa "nada escolhido"
    permitirVazio?: boolean; // false = sem a opção "nada escolhido" (ex: filtro de período, que sempre tem um valor)
    erro?: string;
    desabilitado?: boolean;
    ajuda?: string;
}

// Caixa de seleção (lista suspensa). Mesma ideia do CampoTexto: label + campo + ajuda + erro
export default function CampoSelecao({
    id,
    rotulo,
    valor,
    opcoes,
    aoMudar,
    textoVazio = "Selecione...",
    permitirVazio = true,
    erro,
    desabilitado = false,
    ajuda,
}: CampoSelecaoProps) {
    function tratarMudanca(evento: ChangeEvent<HTMLSelectElement>) {
        aoMudar(evento.target.value);
    }

    return (
        <div className="campo">
            <label htmlFor={id}>{rotulo}</label>
            <select id={id} value={valor} onChange={tratarMudanca} disabled={desabilitado} aria-invalid={erro ? true : undefined}>
                {permitirVazio && <option value="">{textoVazio}</option>}
                {opcoes.map((opcao) => (
                    <option key={opcao.valor} value={opcao.valor}>
                        {opcao.rotulo}
                    </option>
                ))}
            </select>
            {ajuda && <span className="campo-ajuda">{ajuda}</span>}
            {erro && (
                <span className="campo-erro" role="alert">
                    {erro}
                </span>
            )}
        </div>
    );
}

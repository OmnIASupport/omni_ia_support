"use strict";

// Camada de comunicação do frontend com a API do backend (padrão Radar Urbano).
// Se a API estiver em outro endereço, defina antes deste script:
//   <script>window.OMNI_API_URL = "http://127.0.0.1:8001";</script>
window.OmniAPI = (() => {
  const BASE_URL = (window.OMNI_API_URL || "http://127.0.0.1:8001").replace(/\/+$/, "");

  function mensagemErro(dados, status) {
    if (typeof dados?.detail === "string") return dados.detail;
    if (Array.isArray(dados?.detail) && dados.detail[0]?.msg) return dados.detail[0].msg;
    return `Falha na consulta (HTTP ${status}).`;
  }

  async function requisitar(caminho, opcoes = {}, timeoutMs = 15000) {
    let resposta;
    try {
      resposta = await fetch(`${BASE_URL}${caminho}`, {
        cache: "no-store",
        ...opcoes,
        headers: { Accept: "application/json", ...(opcoes.headers || {}) },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (erro) {
      if (erro?.name === "TimeoutError") throw new Error("A consulta demorou demais. Tente novamente.");
      throw new Error(`Não foi possível conectar à API em ${BASE_URL}. Confira se o backend está ligado (iniciar_linux.sh).`);
    }

    let dados = null;
    try {
      dados = await resposta.json();
    } catch {
      throw new Error(`A API respondeu de forma inválida (HTTP ${resposta.status}).`);
    }
    if (!resposta.ok) throw new Error(mensagemErro(dados, resposta.status));
    return dados;
  }

  const consultar = (caminho) => requisitar(caminho);
  const enviar = (caminho, corpo, timeoutMs = 15000) =>
    requisitar(caminho, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    }, timeoutMs);

  return { BASE_URL, consultar, enviar };
})();

// Utilitários de formatação compartilhados pelas páginas.
window.OmniFmt = {
  inteiro: (v) => (v == null ? "—" : Number(v).toLocaleString("pt-BR")),
  decimal: (v, casas = 2) =>
    v == null ? "—" : Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: casas }),
  percentual: (v) =>
    v == null ? "—" : `${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`,
  fracaoPercentual: (v) =>
    v == null ? "—" : `${(Number(v) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`,
  dataBR: (v) => {
    if (!v) return "—";
    const [a, m, d] = String(v).slice(0, 10).split("-");
    return `${d}/${m}/${a}`;
  },
  rotulo: (v) => String(v ?? "—").replaceAll("_", " "),
};

/* =========================================================
   Omni IA Support — Dashboard

   - Sem token: mostra zeros e traços, sem bloquear a página.
   - Com token: GET /usuarios/me preenche o resumo.
   - Nível de acessibilidade: vem do cadastro.
   - Na plataforma desde: data do último login.
   - Traduções realizadas: total de cliques em "Traduzir".
   ========================================================= */

   (() => {
    "use strict";

    const API_URL = "http://127.0.0.1:8000";
    const CHAVE_TOKEN = "omni:token_acesso";

    const $ = (id) => document.getElementById(id);

    const totalTraducoes = $("total-traducoes");
    const ultimoAcesso = $("ultimo-acesso");
    const nivelAcessibilidade = $("nivel-acessibilidade");
    const dataCadastro = $("data-cadastro");

    const obrigatorios = [
        totalTraducoes,
        ultimoAcesso,
        nivelAcessibilidade,
        dataCadastro,
    ];

    if (obrigatorios.some((elemento) => !elemento)) {
        console.error(
            "Dashboard: faltam elementos no HTML. " +
            "Confira os IDs."
        );

        return;
    }

    let tokenDaSessao = null;

    // ---------- Utilitários ----------
    const obterToken = () => {
        try {
            return localStorage.getItem(CHAVE_TOKEN);
        } catch {
            return null;
        }
    };

    const traduzirNivel = (valor) => {
        if (valor === "surdo") return "Surdo";
        if (valor === "ouvinte") return "Ouvinte";
        if (valor === "ambos") return "Misto";

        return "Não informado";
    };

    const formatarData = (valor) => {
        if (!valor) return "—";

        const data = new Date(valor);

        if (Number.isNaN(data.getTime())) {
            return "—";
        }

        return new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).format(data);
    };

    const formatarDataHora = (valor) => {
        if (!valor) return "—";

        const data = new Date(valor);

        if (Number.isNaN(data.getTime())) {
            return "—";
        }

        return new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(data);
    };

    // ---------- Mensagens ----------
    function limparResumo() {
        totalTraducoes.textContent = "0";
        ultimoAcesso.textContent = "—";
        nivelAcessibilidade.textContent = "—";
        dataCadastro.textContent = "—";
    }

    function mostrarErro(texto) {
        console.warn(texto);

        // O Dashboard continua utilizável mesmo sem os dados.
        nivelAcessibilidade.textContent = "Indisponível";
        ultimoAcesso.textContent = "—";
        dataCadastro.textContent = "—";
    }

    // ---------- API ----------
    function mensagemDaApi(dados, status) {
        if (Array.isArray(dados?.detail)) {
            return dados.detail
                .map((erro) =>
                    String(erro.msg || "Valor inválido.")
                        .replace(/^Value error,\s*/, "")
                )
                .join(" | ");
        }

        if (typeof dados?.detail === "string") {
            return dados.detail;
        }

        return `Não foi possível concluir a operação. HTTP ${status}.`;
    }

    async function requisicao(caminho, opcoes = {}) {
        const token = tokenDaSessao;

        if (!token || obterToken() !== token) {
            const erro = new Error("Sessão inválida.");
            erro.status = 401;
            throw erro;
        }

        let resposta;

        try {
            resposta = await fetch(API_URL + caminho, {
                ...opcoes,

                headers: {
                    Accept: "application/json",

                    ...(opcoes.body
                        ? { "Content-Type": "application/json" }
                        : {}),

                    Authorization: `Bearer ${token}`,
                },

                cache: "no-store",
            });
        } catch {
            throw new Error(
                "Não foi possível comunicar com o servidor."
            );
        }

        // Ignora a resposta se a sessão mudou durante o envio.
        if (obterToken() !== token) {
            const erro = new Error("Sessão inválida.");
            erro.status = 401;
            throw erro;
        }

        const dados = await resposta.json().catch(() => null);

        if (!resposta.ok) {
            const erro = new Error(
                mensagemDaApi(dados, resposta.status)
            );

            erro.status = resposta.status;

            throw erro;
        }

        if (!dados) {
            throw new Error(
                "O servidor retornou uma resposta inesperada."
            );
        }

        return dados;
    }

    // ---------- Carregamento inicial ----------
    async function carregarResumo() {
        tokenDaSessao = obterToken();

        if (!tokenDaSessao) {
            limparResumo();
            return;
        }

        try {
            const usuario = await requisicao("/usuarios/me");

            totalTraducoes.textContent = String(
                usuario.total_traducoes ?? 0
            );

            ultimoAcesso.textContent = formatarDataHora(
                usuario.ultimo_acesso
            );

            nivelAcessibilidade.textContent = traduzirNivel(
                usuario.tipo_usuario
            );

            dataCadastro.textContent = formatarData(
                usuario.ultimo_acesso
            );
        } catch (erro) {
            if (erro.status === 401) {
                limparResumo();
                return;
            }

            mostrarErro(
                `${erro.message} Recarregue a página para tentar novamente.`
            );
        }
    }

    carregarResumo();
})();
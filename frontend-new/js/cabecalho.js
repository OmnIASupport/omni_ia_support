/* =========================================================
   Omni IA Support — Identificação visual no cabeçalho

   Mostra o nome e a primeira letra após cadastro ou login.

   Não autentica o usuário e não autoriza operações na API.
   ========================================================= */

   (() => {
    "use strict";

    const CHAVE_PERFIL = "omni:perfil-interface";

    const pill = document.querySelector("#user-pill");
    const entrar = document.querySelector("#btn-entrar-header");
    const perfil = document.querySelector("#user-perfil-logado");
    const avatar = document.querySelector("#avatar-iniciais");
    const nome = document.querySelector("#user-nome");
    const remover = document.querySelector("#btn-sair");

    const obrigatorios = [
        pill,
        entrar,
        perfil,
        avatar,
        nome,
        remover,
    ];

    if (obrigatorios.some((elemento) => !elemento)) {
        console.error(
            "Cabeçalho: faltam elementos no index.html."
        );
        return;
    }

    function mostrarVisitante() {
        entrar.hidden = false;
        perfil.hidden = true;
        remover.hidden = true;

        nome.textContent = "";
        avatar.textContent = "?";

        pill.dataset.perfilVisivel = "false";
    }

    function carregarNome() {
        try {
            const salvo = sessionStorage.getItem(CHAVE_PERFIL);

            if (!salvo) return null;

            const dados = JSON.parse(salvo);

            if (
                !dados ||
                typeof dados.nome_exibicao !== "string"
            ) {
                return null;
            }

            const nomeExibicao = dados.nome_exibicao.trim();

            if (!nomeExibicao || nomeExibicao.length > 150) {
                return null;
            }

            return nomeExibicao;
        } catch {
            return null;
        }
    }

    function atualizarCabecalho() {
        const nomeExibicao = carregarNome();

        if (!nomeExibicao) {
            mostrarVisitante();
            return;
        }

        const inicial = Array.from(nomeExibicao)[0]
            .toLocaleUpperCase("pt-BR");

        // Insere somente texto, nunca HTML.
        nome.textContent = nomeExibicao;
        avatar.textContent = inicial;

        perfil.setAttribute(
            "aria-label",
            `Identificação de ${nomeExibicao}`
        );

        entrar.hidden = true;
        perfil.hidden = false;
        remover.hidden = false;

        pill.dataset.perfilVisivel = "true";
    }

    remover.addEventListener("click", () => {
        try {
            sessionStorage.removeItem(CHAVE_PERFIL);
        } catch {
            // Ainda permite limpar a apresentação atual.
        }

        mostrarVisitante();
    });

    window.addEventListener("pageshow", atualizarCabecalho);

    atualizarCabecalho();
})();
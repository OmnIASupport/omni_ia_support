/* =========================================================
   Omni IA Support — Identificação visual no cabeçalho

   - Mostra o nome e a primeira letra após cadastro ou login.
   - Atualiza o nome quando o perfil é alterado.
   - Ao sair, remove o token e a identificação visual.
   - Recarrega a página para reiniciar o widget como visitante.

   A identificação visual não autentica o usuário.
   A validação das requisições continua no backend.
   ========================================================= */

(() => {
    "use strict";

    const CHAVE_PERFIL = "omni:perfil-interface";
    const CHAVE_TOKEN = "omni:token_acesso";
    const EVENTO_PERFIL = "omni:perfil-atualizado";

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
            "Cabeçalho: faltam elementos no HTML. " +
            "Confira os IDs."
        );

        return;
    }

    let saindo = false;

    // ---------- Estado de visitante ----------
    function mostrarVisitante() {
        entrar.hidden = false;
        perfil.hidden = true;
        remover.hidden = true;

        nome.textContent = "";
        avatar.textContent = "?";

        perfil.removeAttribute("aria-label");

        pill.dataset.perfilVisivel = "false";
    }

    // ---------- Nome para apresentação ----------
    function carregarNome() {
        try {
            const salvo = sessionStorage.getItem(
                CHAVE_PERFIL
            );

            if (!salvo) {
                return null;
            }

            const dados = JSON.parse(salvo);

            if (
                !dados ||
                typeof dados.nome_exibicao !== "string"
            ) {
                return null;
            }

            const nomeExibicao =
                dados.nome_exibicao.trim();

            if (
                !nomeExibicao ||
                nomeExibicao.length > 150
            ) {
                return null;
            }

            return nomeExibicao;
        } catch {
            return null;
        }
    }

    // ---------- Atualização do cabeçalho ----------
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

    // ---------- Saída da conta neste navegador ----------
    remover.addEventListener("click", (evento) => {
        evento.preventDefault();

        if (saindo) {
            return;
        }

        saindo = true;

        // Primeiro remove a credencial usada pela API.
        try {
            localStorage.removeItem(CHAVE_TOKEN);

            if (
                localStorage.getItem(CHAVE_TOKEN) !== null
            ) {
                throw new Error(
                    "A credencial permaneceu no armazenamento."
                );
            }
        } catch {
            saindo = false;

            console.error(
                "Não foi possível remover a credencial de acesso."
            );

            window.alert(
                "Não foi possível concluir a saída. " +
                "Confira as permissões de armazenamento " +
                "do navegador e tente novamente."
            );

            return;
        }

        // Depois limpa a identificação visual.
        try {
            sessionStorage.removeItem(CHAVE_PERFIL);
        } catch {
            console.warn(
                "Não foi possível remover o nome " +
                "do armazenamento."
            );
        }

        mostrarVisitante();

        // Reinicia o widget sem o token da conta anterior.
        window.location.reload();
    });

    // Atualiza também ao retornar pelo histórico do navegador.
    window.addEventListener(
        "pageshow",
        atualizarCabecalho
    );

    // Atualiza quando o perfil é alterado na mesma página.
    window.addEventListener(
        EVENTO_PERFIL,
        atualizarCabecalho
    );

    atualizarCabecalho();
})();
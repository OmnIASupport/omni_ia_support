/* =========================================================
   Omni IA Support — Auth (header dinâmico na home)
   Lê a sessão salva pelo login.js e atualiza o user-pill.
   ========================================================= */

(() => {
    "use strict";

    const CHAVE_USUARIO  = "omni:usuario";
    const CHAVE_SESSAO   = "omni:sessao";

    const pill        = document.getElementById("user-pill");
    const perfilBox   = document.getElementById("user-perfil-logado");
    const elNome      = document.getElementById("user-nome");
    const elPapel     = document.getElementById("user-papel");
    const elIniciais  = document.getElementById("avatar-iniciais");
    const btnSair     = document.getElementById("btn-sair");

    if (!pill) return;

    // Lê sessão (localStorage = "lembrar de mim"; sessionStorage = sessão temporária)
    const lerSessao = () => {
        try {
            const raw = localStorage.getItem(CHAVE_USUARIO) || sessionStorage.getItem(CHAVE_SESSAO);
            return raw ? JSON.parse(raw) : null;
        } catch (_) {
            return null;
        }
    };

    const usuario = lerSessao();

    if (usuario) {
        // Logado: mostra perfil, esconde "Entrar"
        pill.dataset.logado = "true";
        perfilBox.hidden = false;
        if (elNome)     elNome.textContent     = usuario.nome     || "Usuário";
        if (elPapel)    elPapel.textContent    = usuario.papel    || "Conta ativa";
        if (elIniciais) elIniciais.textContent = usuario.iniciais || "?";
    } else {
        // Deslogado: mostra "Entrar"
        pill.dataset.logado = "false";
        perfilBox.hidden = true;
    }

    // Logout
    btnSair?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        localStorage.removeItem(CHAVE_USUARIO);
        sessionStorage.removeItem(CHAVE_SESSAO);
        window.location.reload();
    });
})();

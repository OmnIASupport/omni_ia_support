/* =========================================================
   Omni IA Support — Ajuda
   - Atualiza o cabeçalho conforme a sessão do usuário
   - Controla as perguntas frequentes (FAQ)
   ========================================================= */

(() => {
  "use strict";

  const CHAVE_USUARIO = "omni:usuario";
  const CHAVE_SESSAO = "omni:sessao";

  const pill = document.getElementById("user-pill");
  const perfilBox = document.getElementById("user-perfil-logado");
  const btnEntrar = document.getElementById("btn-entrar-header");
  const elNome = document.getElementById("user-nome");
  const elPapel = document.getElementById("user-papel");
  const elIniciais = document.getElementById("avatar-iniciais");
  const btnSair = document.getElementById("btn-sair");

  function lerSessao() {
    try {
      // Mantém compatibilidade com os dados usados pelo login do projeto.
      const raw =
        localStorage.getItem(CHAVE_USUARIO) ||
        sessionStorage.getItem(CHAVE_SESSAO);

      if (!raw) return null;

      const dados = JSON.parse(raw);

      // Alguns sistemas guardam os dados do usuário dentro de "usuario".
      return dados && dados.usuario ? dados.usuario : dados;
    } catch (erro) {
      console.warn("Não foi possível ler a sessão do usuário.", erro);
      return null;
    }
  }

  function obterIniciais(nome) {
    const partes = String(nome || "Usuário")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (partes.length === 0) return "?";
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();

    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  function atualizarCabecalho() {
    if (!pill) return;

    const usuario = lerSessao();
    const logado = Boolean(usuario);

    pill.dataset.logado = String(logado);

    if (btnEntrar) {
      btnEntrar.hidden = logado;
    }

    if (perfilBox) {
      perfilBox.hidden = !logado;
    }

    if (!logado) return;

    const nome = usuario.nome || usuario.name || "Usuário";
    const papel = usuario.papel || usuario.tipo || usuario.role || "Conta ativa";
    const iniciais = usuario.iniciais || obterIniciais(nome);

    if (elNome) elNome.textContent = nome;
    if (elPapel) elPapel.textContent = papel;
    if (elIniciais) elIniciais.textContent = iniciais;
  }

  function sairDaConta(evento) {
    evento.preventDefault();
    evento.stopPropagation();

    try {
      localStorage.removeItem(CHAVE_USUARIO);
      sessionStorage.removeItem(CHAVE_SESSAO);
    } catch (erro) {
      console.error("Não foi possível limpar os dados da sessão.", erro);
    }

    window.location.href = "index.html";
  }

  function configurarFaq() {
    const itens = document.querySelectorAll(".faq-lista .faq-item");

    // Mantém apenas uma pergunta aberta por vez.
    itens.forEach((item) => {
      item.addEventListener("toggle", () => {
        if (!item.open) return;

        itens.forEach((outroItem) => {
          if (outroItem !== item) outroItem.open = false;
        });
      });
    });
  }

  function destacarPaginaAtual() {
    const paginaAtual = window.location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll(".menu a[href]").forEach((link) => {
      const destino = link.getAttribute("href").split("?")[0];

      if (destino === paginaAtual) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  if (btnSair) {
    btnSair.addEventListener("click", sairDaConta);
  }

  atualizarCabecalho();
  configurarFaq();
  destacarPaginaAtual();
})();

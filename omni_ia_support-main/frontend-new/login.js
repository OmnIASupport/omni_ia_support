/* =========================================================
   Omni IA Support — Login
   - Validação client-side
   - "Lembrar de mim" com localStorage
   - Sessão salva em sessionStorage (ou localStorage se lembrar)
   - Redirecionamento para index.html (ou ?redirect=...)
   - Sem botão de convidado (removido do HTML)
   ========================================================= */

(() => {
    "use strict";

    /* ---------- Chaves de armazenamento ---------- */
    const CHAVE_USUARIO        = "omni:usuario";
    const CHAVE_LEMBRAR        = "omni:lembrar";
    const CHAVE_EMAIL_LEMBRADO = "omni:email";
    const CHAVE_SESSAO         = "omni:sessao";

    /* ---------- Credenciais de demonstração ---------- */
    /* Trocar por backend real quando existir. */
    const CREDENCIAIS_DEMO = {
        email: "joao@omni.ia",
        senha: "omni123",
        nome: "João Silva",
        iniciais: "JS",
        papel: "Usuário surdo",
    };

    /* ---------- Atalho para querySelector ---------- */
    const $ = (sel) => document.querySelector(sel);

    /* ---------- Elementos ---------- */
    const form         = $("#form-login");
    const email        = $("#email");
    const senha        = $("#senha");
    const lembrar      = $("#lembrar");
    const toggleSenha  = $("#toggle-senha");
    const btnEntrar    = $("#btn-entrar");
    const erroGeral    = $("#erro-geral");
    const linkEsqueci  = $("#esqueci");

    /* =========================================================
       Utilidades de erro
       ========================================================= */
    const mostrarErro = (campo, msg) => {
        const wrapper = campo.closest(".campo-input");
        const erro    = document.getElementById(`erro-${campo.id}`);
        if (wrapper) wrapper.classList.add("invalido");
        if (erro) {
            erro.textContent = msg;
            erro.hidden = false;
        }
        campo.setAttribute("aria-invalid", "true");
    };

    const limparErro = (campo) => {
        const wrapper = campo.closest(".campo-input");
        const erro    = document.getElementById(`erro-${campo.id}`);
        if (wrapper) wrapper.classList.remove("invalido");
        if (erro) {
            erro.textContent = "";
            erro.hidden = true;
        }
        campo.removeAttribute("aria-invalid");
    };

    const mostrarErroGeral = (msg, tipo = "erro") => {
        erroGeral.textContent = msg;
        erroGeral.hidden = false;

        if (tipo === "ok") {
            erroGeral.style.background = "var(--ok-bg)";
            erroGeral.style.color = "var(--ok)";
            erroGeral.style.border = "1px solid rgba(22, 163, 74, 0.25)";
        } else {
            erroGeral.style.background = "var(--erro-bg)";
            erroGeral.style.color = "var(--erro)";
            erroGeral.style.border = "1px solid rgba(198, 40, 40, 0.25)";
        }
    };

    const limparErroGeral = () => {
        erroGeral.textContent = "";
        erroGeral.hidden = true;
        erroGeral.style.background = "";
        erroGeral.style.color = "";
        erroGeral.style.border = "";
    };

    /* =========================================================
       Validação
       ========================================================= */
    const validarEmail = (valor) => {
        if (!valor.trim()) return "Informe seu e-mail.";
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(valor.trim())) return "E-mail inválido.";
        return null;
    };

    const validarSenha = (valor) => {
        if (!valor) return "Informe sua senha.";
        if (valor.length < 6) return "A senha precisa ter pelo menos 6 caracteres.";
        return null;
    };

    const validarFormulario = () => {
        limparErroGeral();
        let ok = true;

        const erroEmail = validarEmail(email.value);
        if (erroEmail) { mostrarErro(email, erroEmail); ok = false; }
        else limparErro(email);

        const erroSenha = validarSenha(senha.value);
        if (erroSenha) { mostrarErro(senha, erroSenha); ok = false; }
        else limparErro(senha);

        return ok;
    };

    /* =========================================================
       Sessão
       ========================================================= */
    const salvarSessao = (usuario, persistir) => {
        const payload = JSON.stringify(usuario);

        if (persistir) {
            localStorage.setItem(CHAVE_USUARIO, payload);
            sessionStorage.removeItem(CHAVE_SESSAO);
        } else {
            sessionStorage.setItem(CHAVE_SESSAO, payload);
            localStorage.removeItem(CHAVE_USUARIO);
        }
    };

    /* =========================================================
       Redirecionamento
       ========================================================= */
    const redirecionar = () => {
        const params   = new URLSearchParams(window.location.search);
        const destino  = params.get("redirect") || "index.html";

        /* Aceita apenas caminhos relativos seguros (evita open redirect) */
        const seguro = /^[\w./-]+\.html(\?.*)?$/.test(destino)
            ? destino
            : "index.html";

        window.location.href = seguro;
    };

    /* =========================================================
       "Lembrar de mim"
       ========================================================= */
    const carregarEmailLembrado = () => {
        try {
            const lembrarAtivo = localStorage.getItem(CHAVE_LEMBRAR) === "1";
            const emailSalvo   = localStorage.getItem(CHAVE_EMAIL_LEMBRADO);

            if (lembrarAtivo && emailSalvo) {
                email.value     = emailSalvo;
                lembrar.checked = true;
                senha.focus();
                return;
            }
        } catch (_) { /* ignora */ }

        email.focus();
    };

    /* =========================================================
       Mostrar / ocultar senha
       ========================================================= */
    toggleSenha.addEventListener("click", () => {
        const visivel = senha.type === "text";
        senha.type = visivel ? "password" : "text";

        toggleSenha.setAttribute("aria-pressed", String(!visivel));
        toggleSenha.setAttribute(
            "aria-label",
            visivel ? "Mostrar senha" : "Ocultar senha"
        );

        const icone = toggleSenha.querySelector("i");
        icone.className = visivel
            ? "fa-regular fa-eye"
            : "fa-regular fa-eye-slash";

        senha.focus();
    });

    /* =========================================================
       Limpar erros ao digitar
       ========================================================= */
    [email, senha].forEach((campo) => {
        campo.addEventListener("input", () => {
            limparErro(campo);
            limparErroGeral();
        });
    });

    /* =========================================================
       Submit do formulário
       ========================================================= */
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!validarFormulario()) return;

        btnEntrar.disabled = true;
        btnEntrar.classList.add("carregando");
        btnEntrar.querySelector(".btn-texto").textContent = "Entrando";

        /* Simula latência de rede (trocar por fetch real) */
        await new Promise((r) => setTimeout(r, 700));

        const emailDigitado = email.value.trim().toLowerCase();
        const senhaDigitada = senha.value;

        /* Validação de demonstração: aceita a credencial fixa
           OU qualquer e-mail válido com senha >= 6 (modo demo).
           Substitua por chamada de API quando houver backend. */
        const credenciaisOk =
            emailDigitado === CREDENCIAIS_DEMO.email &&
            senhaDigitada === CREDENCIAIS_DEMO.senha;

        /* Bloco de demo: se não bater com a credencial fixa,
           aceita qualquer e-mail válido (comportamento de demonstração). */
        if (!credenciaisOk) {
            /* Comente a linha abaixo para exigir apenas a credencial fixa */
            const modoDemo = true;
            if (!modoDemo) {
                mostrarErroGeral("E-mail ou senha incorretos. Tente novamente.");
                btnEntrar.disabled = false;
                btnEntrar.classList.remove("carregando");
                btnEntrar.querySelector(".btn-texto").textContent = "Entrar";
                return;
            }
        }

        /* Monta o objeto de usuário salvo na sessão */
        const usuario = {
            nome:     CREDENCIAIS_DEMO.nome,
            iniciais: CREDENCIAIS_DEMO.iniciais,
            papel:    CREDENCIAIS_DEMO.papel,
            email:    emailDigitado,
            entrouEm: new Date().toISOString(),
        };

        salvarSessao(usuario, lembrar.checked);

        if (lembrar.checked) {
            localStorage.setItem(CHAVE_LEMBRAR, "1");
            localStorage.setItem(CHAVE_EMAIL_LEMBRADO, emailDigitado);
        } else {
            localStorage.removeItem(CHAVE_LEMBRAR);
            localStorage.removeItem(CHAVE_EMAIL_LEMBRADO);
        }

        btnEntrar.querySelector(".btn-texto").textContent = "Tudo certo!";
        setTimeout(redirecionar, 350);
    });

    /* =========================================================
       Esqueci a senha (simulação)
       ========================================================= */
    linkEsqueci?.addEventListener("click", (e) => {
        e.preventDefault();

        const emailVal = email.value.trim();

        if (validarEmail(emailVal)) {
            mostrarErro(email, "Informe seu e-mail para recuperar a senha.");
            email.focus();
            return;
        }

        mostrarErroGeral(
            `Enviamos um link de recuperação para ${emailVal}. Verifique sua caixa de entrada.`,
            "ok"
        );

        setTimeout(() => {
            limparErroGeral();
        }, 4000);
    });

    /* =========================================================
       Init
       ========================================================= */
    carregarEmailLembrado();
})();

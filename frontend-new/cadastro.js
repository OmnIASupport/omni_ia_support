/* =========================================================
   Omni IA Support — Cadastro
   ========================================================= */

   (() => {
    "use strict";

    const CHAVE_USUARIO = "omni:usuario";
    const $ = (sel) => document.querySelector(sel);

    const form         = $("#form-cadastro");
    const nomeExib     = $("#nome-exibicao");
    const nomeCompleto = $("#nome-completo");
    const email        = $("#email");
    const telefone     = $("#telefone");
    const senha        = $("#senha");
    const termos       = $("#termos");
    const toggleSenha  = $("#toggle-senha");
    const btnCadastrar = $("#btn-cadastrar");
    const erroGeral    = $("#erro-geral");

    if (!form) return;

    // ---------- Utilidades de erro ----------
    const mostrarErro = (campo, msg) => {
        const wrapper = campo.closest(".campo-input") || campo.parentElement;
        const erro    = document.getElementById(`erro-${campo.id}`);
        if (wrapper) wrapper.classList.add("invalido");
        if (erro) { erro.textContent = msg; erro.hidden = false; }
        campo.setAttribute("aria-invalid", "true");
    };

    const limparErro = (campo) => {
        const wrapper = campo.closest(".campo-input") || campo.parentElement;
        const erro    = document.getElementById(`erro-${campo.id}`);
        if (wrapper) wrapper.classList.remove("invalido");
        if (erro) { erro.textContent = ""; erro.hidden = true; }
        campo.removeAttribute("aria-invalid");
    };

    const mostrarErroGeral = (msg) => { erroGeral.textContent = msg; erroGeral.hidden = false; };
    const limparErroGeral  = () => { erroGeral.textContent = ""; erroGeral.hidden = true; };

    // ---------- Validações simples ----------
    const validarNomeExib = (v) => {
        const t = v.trim();
        if (!t) return "Informe como quer ser chamado.";
        if (t.length < 2) return "O nome deve ter pelo menos 2 caracteres.";
        return null;
    };

    // Opcional: se preencher, precisa de nome e sobrenome
    const validarNomeCompleto = (v) => {
        const t = v.trim();
        if (!t) return null;
        if (!t.includes(" ")) return "Informe nome e sobrenome.";
        return null;
    };

    const validarSenha = (v) => {
        if (!v) return "Informe sua senha.";
        if (v.length < 6) return "A senha precisa ter pelo menos 6 caracteres.";
        return null;
    };

    // ---------- E-mail ----------
    const ERROS_DOMINIO = {
        "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gamil.com": "gmail.com",
        "gmail.con": "gmail.com", "gmail.com.br": "gmail.com",
        "hotmial.com": "hotmail.com", "hotmai.com": "hotmail.com", "hotmail.con": "hotmail.com",
        "outlok.com": "outlook.com", "outlook.con": "outlook.com",
        "yaho.com": "yahoo.com", "yahoo.con": "yahoo.com",
    };

    const validarEmailFormato = (v) => {
        const t = v.trim().toLowerCase();
        if (!t) return "Informe seu e-mail.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t)) return "E-mail inválido.";
        const dominio = t.split("@")[1];
        if (ERROS_DOMINIO[dominio]) return `Você quis dizer @${ERROS_DOMINIO[dominio]}?`;
        return null;
    };

    // Consulta DNS: o domínio do e-mail tem servidor de e-mail (MX)?
    // Se a consulta falhar (sem internet etc.), deixa passar.
    const dominioRecebeEmail = async (dominio) => {
        try {
            const ctrl  = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 4000);
            const resp  = await fetch(
                `https://dns.google/resolve?name=${encodeURIComponent(dominio)}&type=MX`,
                { signal: ctrl.signal }
            );
            clearTimeout(timer);
            const dados = await resp.json();
            if (dados.Status === 3) return false;
            return Array.isArray(dados.Answer) && dados.Answer.length > 0;
        } catch (_) {
            return true;
        }
    };

    // ---------- Telefone ----------
    const DDDS_VALIDOS = new Set([
        11,12,13,14,15,16,17,18,19, 21,22,24,27,28, 31,32,33,34,35,37,38,
        41,42,43,44,45,46,47,48,49, 51,53,54,55, 61,62,63,64,65,66,67,68,69,
        71,73,74,75,77,79, 81,82,83,84,85,86,87,88,89, 91,92,93,94,95,96,97,98,99
    ]);

    const soDigitos = (v) => v.replace(/\D/g, "");

    const validarTelefone = (v) => {
        const d = soDigitos(v);
        if (!d) return null; // opcional
        if (d.length < 10) return "Informe o telefone com DDD. Ex.: (11) 99999-9999";
        if (d.length > 11) return "Telefone com dígitos demais.";
        if (!DDDS_VALIDOS.has(Number(d.slice(0, 2)))) return "DDD inválido.";
        if (d.length === 11 && d[2] !== "9") return "Celular deve começar com 9 após o DDD.";
        if (d.length === 10 && !"2345".includes(d[2])) return "Telefone fixo inválido.";
        return null;
    };

    // Máscara: (11) 99999-9999
    const formatarTelefone = (v) => {
        const d = soDigitos(v).slice(0, 11);
        if (d.length <= 2) return d ? `(${d}` : "";
        if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
        if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
        return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    };

    telefone.addEventListener("input", () => {
        telefone.value = formatarTelefone(telefone.value);
    });

    // ---------- Acessibilidade e termos ----------
    const nivelEscolhido = () => form.querySelector('input[name="acessibilidade"]:checked');

    const validarFormulario = async () => {
        limparErroGeral();
        let ok = true;

        const checar = (campo, erro) => {
            if (erro) { mostrarErro(campo, erro); ok = false; }
            else limparErro(campo);
        };

        checar(nomeExib, validarNomeExib(nomeExib.value));
        checar(nomeCompleto, validarNomeCompleto(nomeCompleto.value));
        checar(telefone, validarTelefone(telefone.value));
        checar(senha, validarSenha(senha.value));

        // E-mail: formato primeiro; só consulta o DNS se o formato estiver ok
        let erroEmail = validarEmailFormato(email.value);
        if (!erroEmail) {
            const dominio = email.value.trim().toLowerCase().split("@")[1];
            if (!(await dominioRecebeEmail(dominio))) {
                erroEmail = "Esse domínio de e-mail não parece existir.";
            }
        }
        checar(email, erroEmail);

        const erroAcess = $("#erro-acessibilidade");
        if (!nivelEscolhido()) {
            erroAcess.textContent = "Escolha um nível de acessibilidade.";
            erroAcess.hidden = false;
            ok = false;
        } else {
            erroAcess.hidden = true;
        }

        const erroTermos = $("#erro-termos");
        if (!termos.checked) {
            erroTermos.textContent = "Você precisa aceitar os termos para continuar.";
            erroTermos.hidden = false;
            ok = false;
        } else {
            erroTermos.hidden = true;
        }

        return ok;
    };

    // ---------- Mostrar/ocultar senha ----------
    toggleSenha.addEventListener("click", () => {
        const visivel = senha.type === "text";
        senha.type = visivel ? "password" : "text";
        toggleSenha.setAttribute("aria-pressed", String(!visivel));
        toggleSenha.setAttribute("aria-label", visivel ? "Mostrar senha" : "Ocultar senha");
        toggleSenha.querySelector("i").className = visivel ? "fa-regular fa-eye" : "fa-regular fa-eye-slash";
    });

    // ---------- Limpar erros ao digitar ----------
    [nomeExib, nomeCompleto, email, telefone, senha].forEach((campo) => {
        campo.addEventListener("input", () => {
            limparErro(campo);
            limparErroGeral();
        });
    });

    form.querySelectorAll('input[name="acessibilidade"]').forEach((radio) => {
        radio.addEventListener("change", () => { $("#erro-acessibilidade").hidden = true; });
    });

    termos.addEventListener("change", () => {
        if (termos.checked) $("#erro-termos").hidden = true;
    });

    // ---------- Envio ----------
    const textoBtn = btnCadastrar.querySelector(".btn-texto");

    const liberarBotao = () => {
        btnCadastrar.disabled = false;
        btnCadastrar.classList.remove("carregando");
        textoBtn.textContent = "Criar conta";
    };

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        btnCadastrar.disabled = true;
        btnCadastrar.classList.add("carregando");
        textoBtn.textContent = "Verificando";

        if (!(await validarFormulario())) return liberarBotao();

        const emailFinal = email.value.trim().toLowerCase();
        if (OmniContas.existe(emailFinal)) {
            mostrarErro(email, "Já existe uma conta com esse e-mail.");
            return liberarBotao();
        }

        textoBtn.textContent = "Criando conta";
        await new Promise((r) => setTimeout(r, 600)); // simula rede

        const nivel  = nivelEscolhido().value;
        const papeis = { surdo: "Usuário Surdo", ouvinte: "Usuário Ouvinte", ambos: "Usuário Bilíngue" };

        const nomeFinal = nomeExib.value.trim();
        const iniciais  = nomeFinal.split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase();

        const usuario = {
            nome: nomeFinal,
            nomeCompleto: nomeCompleto.value.trim(),
            iniciais: iniciais || "?",
            papel: papeis[nivel] || "Usuário",
            email: emailFinal,
            telefone: soDigitos(telefone.value),
            acessibilidade: nivel,
            criadoEm: new Date().toISOString(),
        };

        try {
            await OmniContas.criar(usuario, senha.value);                 // guarda a conta (senha em hash)
            localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario)); // já deixa logado
        } catch (_) {
            mostrarErroGeral("Não foi possível salvar sua conta. Verifique o armazenamento do navegador.");
            return liberarBotao();
        }

        textoBtn.textContent = "Tudo certo!";
        setTimeout(() => { window.location.href = "index.html"; }, 500);
    });
})();
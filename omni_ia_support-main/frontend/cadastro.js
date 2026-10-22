/* =========================================================
   Omni IA Support — Cadastro (JS Completo)
   ========================================================= */

(() => {
    "use strict";

    const CHAVE_USUARIO = "omni:usuario";
    const $ = (sel) => document.querySelector(sel);

    const form         = $("#form-cadastro");
    const nome         = $("#nome");
    const dataNasc     = $("#data-nascimento");
    const email        = $("#email");
    const senha        = $("#senha");
    const termos       = $("#termos");
    const toggleSenha  = $("#toggle-senha");
    const btnCadastrar = $("#btn-cadastrar");
    const erroGeral    = $("#erro-geral");

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

    const mostrarErroGeral = (msg) => { 
        erroGeral.textContent = msg; 
        erroGeral.hidden = false; 
    };
    
    const limparErroGeral = () => { 
        erroGeral.textContent = "";  
        erroGeral.hidden = true; 
    };

    // ---------- Validações ----------
    const validarNome = (valor) => {
        if (!valor.trim()) return "Informe seu nome.";
        if (valor.trim().length < 3) return "O nome deve ter pelo menos 3 caracteres.";
        if (!valor.trim().includes(" ")) return "Informe o nome completo (nome e sobrenome).";
        return null;
    };

    const validarDataNasc = (valor) => {
        if (!valor) return "Informe sua data de nascimento.";
        const data = new Date(valor);
        if (isNaN(data.getTime())) return "Data inválida.";
        const hoje = new Date();
        let idade = hoje.getFullYear() - data.getFullYear();
        const m = hoje.getMonth() - data.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < data.getDate())) idade--;
        if (idade < 0)   return "Data no futuro não é válida.";
        if (idade < 13)  return "Você precisa ter pelo menos 13 anos.";
        if (idade > 120) return "Verifique a data informada.";
        return null;
    };

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

    const validarAcessibilidade = () => {
        const selecionado = form.querySelector('input[name="acessibilidade"]:checked');
        if (!selecionado) return "Escolha um nível de acessibilidade.";
        return null;
    };

    const validarTermos = () => {
        if (!termos.checked) return "Você precisa aceitar os termos para continuar.";
        return null;
    };

    const validarFormulario = () => {
        limparErroGeral();
        let ok = true;

        const eNome = validarNome(nome.value);
        if (eNome) { mostrarErro(nome, eNome); ok = false; } else limparErro(nome);

        const eData = validarDataNasc(dataNasc.value);
        if (eData) { mostrarErro(dataNasc, eData); ok = false; } else limparErro(dataNasc);

        const eEmail = validarEmail(email.value);
        if (eEmail) { mostrarErro(email, eEmail); ok = false; } else limparErro(email);

        const eSenha = validarSenha(senha.value);
        if (eSenha) { mostrarErro(senha, eSenha); ok = false; } else limparErro(senha);

        // Acessibilidade
        const eAcess = validarAcessibilidade();
        const erroAcess = document.getElementById("erro-acessibilidade");
        if (eAcess) { 
            erroAcess.textContent = eAcess; 
            erroAcess.hidden = false; 
            ok = false; 
        } else {
            erroAcess.hidden = true;
        }

        // Termos
        const eTermos = validarTermos();
        const erroTermos = document.getElementById("erro-termos");
        if (eTermos) { 
            erroTermos.textContent = eTermos; 
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
        const icone = toggleSenha.querySelector("i");
        icone.className = visivel ? "fa-regular fa-eye" : "fa-regular fa-eye-slash";
    });

    // ---------- Limpar erros ao digitar ----------
    [nome, dataNasc, email, senha].forEach((campo) => {
        campo.addEventListener("input", () => {
            limparErro(campo);
            limparErroGeral();
        });
    });

    form.querySelectorAll('input[name="acessibilidade"]').forEach((radio) => {
        radio.addEventListener("change", () => {
            document.getElementById("erro-acessibilidade").hidden = true;
        });
    });

    termos.addEventListener("change", () => {
        if (termos.checked) {
            document.getElementById("erro-termos").hidden = true;
        }
    });

    // ---------- Submit ----------
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!validarFormulario()) return;

        btnCadastrar.disabled = true;
        btnCadastrar.classList.add("carregando");
        btnCadastrar.querySelector(".btn-texto").textContent = "Criando conta";

        // Simula latência de rede
        await new Promise((r) => setTimeout(r, 900));

        // Pega o nível de acessibilidade escolhido
        const nivelAcessibilidade = form.querySelector('input[name="acessibilidade"]:checked').value;

        // Gera iniciais do nome
        const iniciais = nome.value.trim().split(" ")
            .map(n => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

        // Mapeia o papel baseado no nível escolhido
        let papel = "Usuário";
        if (nivelAcessibilidade === "surdo") papel = "Usuário Surdo";
        if (nivelAcessibilidade === "ouvinte") papel = "Usuário Ouvinte";
        if (nivelAcessibilidade === "ambos") papel = "Usuário Bilíngue";

        // Monta o objeto de usuário
        const usuario = {
            nome: nome.value.trim(),
            iniciais: iniciais || "?",
            papel: papel,
            email: email.value.trim().toLowerCase(),
            dataNascimento: dataNasc.value,
            acessibilidade: nivelAcessibilidade,
            criadoEm: new Date().toISOString(),
        };

        // Salva a sessão (cadastro já loga o usuário)
        try {
            localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
        } catch (_) {
            mostrarErroGeral("Não foi possível salvar sua conta. Verifique o armazenamento do navegador.");
            btnCadastrar.disabled = false;
            btnCadastrar.classList.remove("carregando");
            btnCadastrar.querySelector(".btn-texto").textContent = "Criar conta";
            return;
        }

        btnCadastrar.querySelector(".btn-texto").textContent = "Tudo certo!";
        setTimeout(() => {
            window.location.href = "index.html";
        }, 500);
    });
})();

/* =========================================================
   Omni IA Support — Contas (simulação local, sem servidor)
   ========================================================= */

   (() => {
    "use strict";

    const CHAVE_CONTAS = "omni:contas";

    const lerContas = () => {
        try {
            return JSON.parse(localStorage.getItem(CHAVE_CONTAS)) || {};
        } catch (_) {
            return {};
        }
    };

    // Transforma a senha em um "código" que não dá para ler de volta
    const hash = async (texto) => {
        if (window.crypto?.subtle) {
            const bytes = new TextEncoder().encode(texto);
            const buf   = await crypto.subtle.digest("SHA-256", bytes);
            return Array.from(new Uint8Array(buf))
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");
        }
        // Plano B para navegadores sem crypto.subtle
        let h = 5381;
        for (const c of texto) h = ((h << 5) + h + c.charCodeAt(0)) | 0;
        return "x" + h;
    };

    window.OmniContas = {
        existe: (email) => Boolean(lerContas()[email]),

        criar: async (usuario, senha) => {
            const contas = lerContas();
            const sal = Math.random().toString(36).slice(2);
            contas[usuario.email] = { usuario, sal, hash: await hash(sal + senha) };
            localStorage.setItem(CHAVE_CONTAS, JSON.stringify(contas));
        },

        // Devolve o usuário se e-mail e senha conferem; senão, null
        verificar: async (email, senha) => {
            const conta = lerContas()[email];
            if (!conta) return null;
            return (await hash(conta.sal + senha)) === conta.hash ? conta.usuario : null;
        },
    };
})();   
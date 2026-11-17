/* =========================================================
   Omni IA Support — Widget de Acessibilidade (Seguro)
   ========================================================= */

(() => {
    "use strict";

    const STORAGE_KEY = "omni:acessibilidade_perfil";
    const estadoPadrao = {
        prefere_legenda: false,
        velocidade_audio: 1.0,
        volume_audio: 1.0,
        tamanho_fonte: 100,
        letra_destacada: false,
        modo_escuro: false
    };

    let estado = { ...estadoPadrao };

    // Tenta carregar as preferências salvas
    try {
        const salvo = localStorage.getItem(STORAGE_KEY);
        if (salvo) estado = { ...estado, ...JSON.parse(salvo) };
    } catch (e) {
        console.warn("Erro ao carregar preferências", e);
    }

    const salvar = () => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(estado)); } catch (e) {}
    };

    const criarWidget = () => {
        // Evita criar duplicado se o script for chamado duas vezes
        if (document.getElementById("omni-acess-fab")) return;

        // 1. Cria o Botão Flutuante (FAB) — classe compatível com o CSS
        const fab = document.createElement("button");
        fab.id = "omni-acess-fab";
        fab.className = "acessibilidade-fab";
        fab.setAttribute("aria-label", "Abrir opções de acessibilidade");
        fab.setAttribute("aria-expanded", "false");
        fab.innerHTML = '<i class="fa-solid fa-universal-access" aria-hidden="true"></i>';
        document.body.appendChild(fab);

        // 2. Cria o Painel de Controle — classes compatíveis com o CSS
        const painel = document.createElement("aside");
        painel.id = "omni-acess-painel";
        painel.className = "painel-glass";
        painel.setAttribute("aria-hidden", "true");
        painel.innerHTML = `
            <header class="painel-header">
                <h2><i class="fa-solid fa-universal-access" aria-hidden="true"></i> Acessibilidade</h2>
                <button class="btn-close" id="omni-acess-close" aria-label="Fechar painel">
                    <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
            </header>
            <div class="painel-body">
                <div class="grupo">
                    <h3>Visão e Leitura</h3>
                    <div class="controle-linha">
                        <span class="label"><i class="fa-solid fa-moon" aria-hidden="true"></i> Modo Escuro</span>
                        <label class="switch">
                            <input type="checkbox" id="chk-modo-escuro">
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="controle-linha">
                        <span class="label"><i class="fa-solid fa-a" aria-hidden="true"></i> Letra Destacada</span>
                        <label class="switch">
                            <input type="checkbox" id="chk-letra-destacada">
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>

                <div class="grupo">
                    <h3>Tamanho do Texto</h3>
                    <div class="controle-tamanho-fonte">
                        <span class="label"><i class="fa-solid fa-font" aria-hidden="true"></i> Tamanho da Fonte</span>
                        <div class="botoes-fonte">
                            <button class="btn-fonte" id="btn-fonte-menos" aria-label="Diminuir fonte">A-</button>
                            <span class="valor-fonte" id="txt-fonte-valor">100%</span>
                            <button class="btn-fonte" id="btn-fonte-mais" aria-label="Aumentar fonte">A+</button>
                        </div>
                    </div>
                </div>

                <div class="grupo">
                    <h3>Áudio e Mídia</h3>
                    <div class="controle-linha">
                        <span class="label"><i class="fa-solid fa-closed-captioning" aria-hidden="true"></i> Legendas</span>
                        <label class="switch">
                            <input type="checkbox" id="chk-legenda">
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="controle-slider">
                        <label>Velocidade <span class="valor-slider" id="txt-velocidade">1.0x</span></label>
                        <input type="range" id="range-velocidade" min="0.5" max="2" step="0.1" value="1.0">
                    </div>
                    <div class="controle-slider">
                        <label>Volume <span class="valor-slider" id="txt-volume">100%</span></label>
                        <input type="range" id="range-volume" min="0" max="1" step="0.1" value="1.0">
                    </div>
                </div>

                <button id="omni-acess-reset" class="btn-resetar">Restaurar Padrões</button>
            </div>
        `;
        document.body.appendChild(painel);

        // 3. Abrir / Fechar
        const alternarPainel = (abrir) => {
            painel.classList.toggle("aberto", abrir);
            painel.setAttribute("aria-hidden", String(!abrir));
            fab.setAttribute("aria-expanded", String(abrir));
        };

        fab.addEventListener("click", () => {
            alternarPainel(!painel.classList.contains("aberto"));
        });
        document.getElementById("omni-acess-close").addEventListener("click", () => {
            alternarPainel(false);
        });

        // 4. Inicializa os eventos e o estado visual
        configurarEventos();
        aplicarEstadoVisual();
    };

    const aplicarEstadoVisual = () => {
        // Modo Escuro
        document.body.classList.toggle("dark-mode", estado.modo_escuro);
        const chkEscuro = document.getElementById("chk-modo-escuro");
        if (chkEscuro) chkEscuro.checked = estado.modo_escuro;

        // Letra Destacada
        document.body.classList.toggle("omni-letra-destacada", estado.letra_destacada);
        const chkLetra = document.getElementById("chk-letra-destacada");
        if (chkLetra) chkLetra.checked = estado.letra_destacada;

        // Legenda
        const chkLegenda = document.getElementById("chk-legenda");
        if (chkLegenda) chkLegenda.checked = estado.prefere_legenda;

        // Tamanho da fonte
        document.documentElement.style.fontSize = `${estado.tamanho_fonte}%`;
        const txtFonte = document.getElementById("txt-fonte-valor");
        if (txtFonte) txtFonte.textContent = `${estado.tamanho_fonte}%`;

        // Sliders
        const rVel = document.getElementById("range-velocidade");
        const rVol = document.getElementById("range-volume");
        if (rVel) {
            rVel.value = estado.velocidade_audio;
            document.getElementById("txt-velocidade").textContent = `${parseFloat(estado.velocidade_audio).toFixed(1)}x`;
        }
        if (rVol) {
            rVol.value = estado.volume_audio;
            document.getElementById("txt-volume").textContent = `${Math.round(estado.volume_audio * 100)}%`;
        }
    };

    const configurarEventos = () => {
        document.getElementById("chk-modo-escuro")?.addEventListener("change", (e) => {
            estado.modo_escuro = e.target.checked; aplicarEstadoVisual(); salvar();
        });
        document.getElementById("chk-letra-destacada")?.addEventListener("change", (e) => {
            estado.letra_destacada = e.target.checked; aplicarEstadoVisual(); salvar();
        });
        document.getElementById("chk-legenda")?.addEventListener("change", (e) => {
            estado.prefere_legenda = e.target.checked; aplicarEstadoVisual(); salvar();
        });

        document.getElementById("btn-fonte-mais")?.addEventListener("click", () => {
            if (estado.tamanho_fonte < 150) { estado.tamanho_fonte += 10; aplicarEstadoVisual(); salvar(); }
        });
        document.getElementById("btn-fonte-menos")?.addEventListener("click", () => {
            if (estado.tamanho_fonte > 80) { estado.tamanho_fonte -= 10; aplicarEstadoVisual(); salvar(); }
        });

        document.getElementById("range-velocidade")?.addEventListener("input", (e) => {
            estado.velocidade_audio = parseFloat(e.target.value); aplicarEstadoVisual(); salvar();
        });
        document.getElementById("range-volume")?.addEventListener("input", (e) => {
            estado.volume_audio = parseFloat(e.target.value); aplicarEstadoVisual(); salvar();
        });

        document.getElementById("omni-acess-reset")?.addEventListener("click", () => {
            estado = { ...estadoPadrao }; aplicarEstadoVisual(); salvar();
        });
    };

    // Inicializa quando o DOM estiver pronto
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", criarWidget);
    } else {
        criarWidget();
    }
})();
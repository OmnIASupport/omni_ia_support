/* ============================================================
   Omni IA Support — Avatar Libras (PONTE)  ·  v3
   Arquivo: frontend-new/js/avatar-libras.js
   ------------------------------------------------------------
   O QUE ESTE ARQUIVO FAZ
   • Coloca o boneco (avatar) dentro da caixa #avatar-cena.
   • Liga os botoes Reiniciar / Pausar / Ampliar.
   • Quando voce clica em "Traduzir", ele anima a frase digitada.
   • Se o jarvis_avatar.js nao tiver carregado pela tag <script>,
     ELE MESMO carrega o arquivo e tenta de novo.  <- v3
   • Se algo estiver faltando, mostra um aviso VERMELHO na tela
     (nao so no console), dizendo o que fazer.

   O QUE ELE NAO FAZ
   • Nao mexe no seu traduzir.js (resultado, microfone, voz, banco).
   • Nao usa preventDefault nem stopPropagation: o seu codigo
     continua rodando normalmente, lado a lado.
   ============================================================ */
   (function () {
    'use strict';
  
    /* ================= CONFIGURACAO ================= */
    var CFG = {
      alvo:         '#avatar-cena',              // onde o avatar entra
      enquadre:     'altura',                    // 'altura' = busto | 'contain' = corpo inteiro
      ancoraY:      0.44,                        // 0 = topo · 0.5 = centro · 1 = base
      alturaMinima: 430,                         // px (usado se a cena estiver com altura 0)
      esperaMs:     20000,                       // quanto tempo esperar o motor
      badge:        true                         // selo discreto no canto
    };
  
    var TAG = '[avatar-libras]';
  
    /* ================= UTILIDADES ================= */
  
    // Descobre a URL deste proprio arquivo para achar o motor ao lado dele.
    function urlDaPonte() {
      var tags = document.getElementsByTagName('script');
      for (var i = 0; i < tags.length; i++) {
        var s = tags[i].src || '';
        if (/avatar-libras\.js(\?|#|$)/.test(s)) return s;
      }
      return '';
    }
  
    // ../js/avatar-libras.js  ->  ../static/jarvis_avatar.js
    function urlDoMotor() {
      var p = urlDaPonte();
      if (p) {
        var trocado = p.replace(/\/js\/avatar-libras\.js(\?|#|$)/, '/static/jarvis_avatar.js');
        if (trocado !== p) return trocado;
        return p.replace(/avatar-libras\.js(\?|#|$)/, 'jarvis_avatar.js');
      }
      return '../static/jarvis_avatar.js';
    }
  
    function motorNoHtml() {
      var tags = document.getElementsByTagName('script');
      for (var i = 0; i < tags.length; i++) {
        if (/jarvis_avatar\.js/.test(tags[i].src || '')) return true;
      }
      return false;
    }
  
    // Aviso visivel na pagina (vermelho), alem do console.
    function aviso(titulo, detalhe) {
      var alvo = document.querySelector(CFG.alvo) || document.body;
      var box = document.createElement('div');
      box.className = 'avatar-libras-erro';
      box.innerHTML = '<b>' + titulo + '</b>' +
                      (detalhe ? '<span>' + detalhe + '</span>' : '');
      alvo.appendChild(box);
      console.error(TAG, titulo, detalhe || '');
    }
  
    /* ================= CARREGA O MOTOR ================= */
    function garantirMotor(ok, falhou) {
      var inicio = Date.now();
  
      // ja carregado?
      if (window.JarvisAvatar) return ok();
  
      // tenta injetar a tag <script> do motor
      if (!motorNoHtml()) {
        var url = urlDoMotor();
        console.log(TAG, 'tag do motor ausente — carregando automaticamente:', url);
        var sc = document.createElement('script');
        sc.src = url;
        sc.onerror = function () {
          falhou('O arquivo <code>static/jarvis_avatar.js</code> nao foi encontrado.',
                 'Confira se ele existe em <code>frontend-new/static/</code> e se tem 1,4 MB. ' +
                 'Caminho tentado: <code>' + url + '</code>');
        };
        document.head.appendChild(sc);
      }
  
      // espera aparecer (o arquivo tem 1,4 MB, pode levar um instante)
      (function esperar() {
        if (window.JarvisAvatar) return ok();
        if (Date.now() - inicio > CFG.esperaMs) {
          return falhou('O motor <code>jarvis_avatar.js</code> nao carregou em ' +
                        Math.round(CFG.esperaMs / 1000) + 's.',
                        'Verifique se <code>frontend-new/static/jarvis_avatar.js</code> ' +
                        'existe e tem 1.392.082 bytes.');
        }
        setTimeout(esperar, 100);
      })();
    }
  
    /* ================= INICIALIZACAO ================= */
    garantirMotor(iniciar, function (t, d) { aviso(t, d); });
  
    function iniciar() {
      var cena = document.querySelector(CFG.alvo);
      if (!cena) {
        return aviso('Nao achei o elemento <code>#avatar-cena</code>.',
                     'Ele precisa existir no traduzir.html.');
      }
  
      // 1. remove o placeholder 3D antigo, se ainda existir
      var ph = cena.querySelector('.avatar-3d-placeholder');
      if (ph && ph.parentNode) ph.parentNode.removeChild(ph);
  
      // 2. garante altura (canvas dentro de div de altura 0 = invisivel)
      if (cena.getBoundingClientRect().height < 40) {
        cena.style.minHeight = CFG.alturaMinima + 'px';
      }
  
      // 3. monta o avatar
      var avatar;
      try {
        avatar = window.JarvisAvatar.montar(cena, {
          transparente: true,
          enquadre:     CFG.enquadre,
          ancoraY:      CFG.ancoraY
        });
      } catch (e) {
        return aviso('O motor carregou, mas deu erro ao montar.',
                     String(e && e.message || e));
      }
  
      if (avatar.canvas) avatar.canvas.classList.add('avatar-libras');
  
      /* ---------- selo de estado ---------- */
      var badge = null;
      if (CFG.badge) {
        badge = document.createElement('div');
        badge.className = 'avatar-libras-badge';
        cena.appendChild(badge);
      }
      function selo(txt) {
        if (!badge) return;
        if (!txt) { badge.classList.remove('on'); return; }
        badge.textContent = txt;
        badge.classList.add('on');
      }
  
      /* ---------- texto de entrada ---------- */
      var entrada = document.getElementById('texto-entrada');
      function lerTexto() {
        if (entrada && entrada.value) return entrada.value.trim();
        return (window.__ultimaFrase || '').trim();
      }
  
      /* ---------- animacao ---------- */
      var rodando = false;
      var fila = [];
      var ativo = true;
  
      function animar(texto) {
        if (!ativo || !texto) return Promise.resolve(false);
        if (rodando) { fila.push(texto); return Promise.resolve(false); }
  
        var sinais = avatar.interpretar(texto);
        if (!sinais.length) {
          selo('sem sinal mapeado');
          setTimeout(function () { selo(''); }, 2200);
          return Promise.resolve(false);
        }
  
        rodando = true;
        selo('sinalizando: ' + sinais.join(' \u00b7 '));
        cena.setAttribute('data-sinalizando', 'true');
  
        return avatar.frase(texto).then(function () {
          rodando = false;
          selo('');
          cena.removeAttribute('data-sinalizando');
          if (fila.length) animar(fila.shift());
          return true;
        });
      }
  
      function animarSinal(nome) {
        if (!ativo || !nome) return Promise.resolve(false);
        selo('sinal: ' + nome);
        cena.setAttribute('data-sinalizando', 'true');
        return avatar.sinalizar(nome).then(function () {
          selo('');
          cena.removeAttribute('data-sinalizando');
          return true;
        });
      }
  
      /* ---------- botoes da pagina (sem bloquear o seu JS) ---------- */
      document.addEventListener('click', function (ev) {
        var t = ev.target;
        if (!t || !t.closest) return;
  
        if (t.closest('#btn-traduzir')) {
          var txt = lerTexto();
          if (txt) animar(txt);
          return;
        }
  
        if (t.closest('#btn-avatar-reiniciar')) {
          ativo = true; rodando = false; fila.length = 0;
          avatar.neutro(); selo('');
          cena.removeAttribute('data-sinalizando');
          return;
        }
  
        if (t.closest('#btn-avatar-pausar')) {
          ativo = !ativo;
          if (!ativo) { avatar.parar(); selo('pausado'); }
          else { avatar.neutro(); selo(''); cena.removeAttribute('data-sinalizando'); }
          return;
        }
  
        if (t.closest('#btn-avatar-tela-cheia')) {
          if (!document.fullscreenElement) {
            if (cena.requestFullscreen) cena.requestFullscreen();
          } else if (document.exitFullscreen) {
            document.exitFullscreen();
          }
          return;
        }
      }, true);
  
      /* ---------- tela cheia ---------- */
      document.addEventListener('fullscreenchange', function () {
        avatar.enquadrar(document.fullscreenElement
          ? { enquadre: 'contain', ancoraY: 0.5 }
          : { enquadre: CFG.enquadre, ancoraY: CFG.ancoraY });
      });
  
      /* ---------- API publica ---------- */
      window.AvatarLibras = {
        animar:      animar,
        sinalizar:   animarSinal,
        interpretar: function (x) { return avatar.interpretar(x); },
        ocupado:     function () { return rodando; },
        neutro:      function () { ativo = true; return avatar.neutro(); },
        pausar:      function () { ativo = false; avatar.parar(); selo('pausado'); },
        retomar:     function () { ativo = true; avatar.neutro(); selo(''); },
        enquadrar:   function (o) { return avatar.enquadrar(o); },
        avatar:      avatar
      };
  
      console.log(TAG, 'pronto. Sinais:', avatar.sinais().join(', '));
    }
  })();
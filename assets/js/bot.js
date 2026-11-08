/* Bot de WhatsApp — demostración interactiva (client-side only).
   Flujo de 5 pasos: tipo → servicio → descripción → colonia/horario → resumen.
   Rama de emergencia con triage y fallback de llamada.
   Nada se envía a ningún servidor: el estado final es una demostración. */
(function () {
  "use strict";
  var BUSINESS_NAME = "Servicios Técnicos Integrados"; // one swappable constant
  var PHONE_TEL = "tel:+522226571548";

  var body = document.getElementById("chat-body");
  var actions = document.getElementById("chat-actions");
  var pill = document.getElementById("step-pill");
  var restartBtn = document.getElementById("bot-restart");
  if (!body || !actions) return;

  var state = { kind: null, service: null, problem: "", colonia: "", horario: "" };

  function scrollDown() { body.scrollTop = body.scrollHeight; }
  function setPill(text) { if (pill) pill.textContent = text; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function addMsg(role, text, label) {
    var p = document.createElement("p");
    p.className = "msg msg--" + role;
    if (label) {
      var s = document.createElement("span");
      s.className = "msg-label";
      s.textContent = label;
      p.appendChild(s);
    }
    // text may contain \n → split into lines with <br>
    text.split("\n").forEach(function (line, i) {
      if (i > 0) p.appendChild(document.createElement("br"));
      p.appendChild(document.createTextNode(line));
    });
    body.appendChild(p);
    scrollDown();
    return p;
  }
  function addSys(text) {
    var p = document.createElement("p");
    p.className = "msg msg--sys";
    p.textContent = text;
    body.appendChild(p);
    scrollDown();
  }
  function botSay(text) {
    var t = document.createElement("span");
    t.className = "typing";
    t.setAttribute("aria-hidden", "true");
    t.innerHTML = "<i></i><i></i><i></i>";
    body.appendChild(t);
    scrollDown();
    return wait(500).then(function () {
      t.remove();
      addMsg("bot", text, "Bot STI");
    });
  }
  function clearActions() { actions.innerHTML = ""; }

  function choiceRow(buttons) {
    clearActions();
    var row = document.createElement("div");
    row.className = "choice-row";
    buttons.forEach(function (b) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn" + (b.cls ? " " + b.cls : "");
      btn.textContent = b.label;
      btn.addEventListener("click", function () { b.onClick(); });
      row.appendChild(btn);
    });
    actions.appendChild(row);
  }

  /* ---------- step 1 ---------- */
  function start() {
    state = { kind: null, service: null, problem: "", colonia: "", horario: "" };
    body.innerHTML = "";
    setPill("Paso 1 de 5");
    botSay("¡Hola! Soy el asistente de " + BUSINESS_NAME + ". ¿Emergencia o cotización?")
      .then(function () {
        choiceRow([
          { label: "Emergencia", cls: "choice-btn--call", onClick: pickEmergency },
          { label: "Cotización", cls: "choice-btn--volt", onClick: pickQuote }
        ]);
      });
  }

  function pickEmergency() {
    state.kind = "Emergencia";
    addMsg("user", "Emergencia");
    setPill("Emergencia");
    botSay("Entendido, vamos por partes. ¿Hay riesgo inmediato — chispas, humo u olor a gas?")
      .then(function () {
        choiceRow([
          { label: "Sí, hay riesgo", cls: "choice-btn--call", onClick: riskYes },
          { label: "No, no hay riesgo", onClick: riskNo }
        ]);
      });
  }

  function riskYes() {
    addMsg("user", "Sí, hay riesgo");
    botSay("Sal del lugar ahora y llama a emergencias. Si huele a gas, ventila solo si es seguro hacerlo desde fuera. No toques cables ni interruptores.")
      .then(function () {
        clearActions();
        var row = document.createElement("div");
        row.className = "choice-row";
        var call = document.createElement("a");
        call.className = "choice-btn choice-btn--call";
        call.href = PHONE_TEL;
        call.textContent = "Llamar ahora";
        call.style.display = "flex";
        call.style.alignItems = "center";
        call.style.justifyContent = "center";
        call.style.textDecoration = "none";
        row.appendChild(call);
        var cont = document.createElement("button");
        cont.type = "button";
        cont.className = "choice-btn";
        cont.textContent = "Ya estoy a salvo — seguir";
        cont.addEventListener("click", function () { askService(true); });
        row.appendChild(cont);
        actions.appendChild(row);
        var hint = document.createElement("p");
        hint.className = "bot-hint";
        hint.textContent = "Guía general de seguridad — no sustituye a un técnico.";
        actions.appendChild(hint);
      });
  }

  function riskNo() {
    addMsg("user", "No, no hay riesgo");
    botSay("Bien. ¿Puedes cortar la luz o el agua de forma segura mientras llega ayuda?")
      .then(function () {
        choiceRow([
          { label: "Sí, ya lo corté", onClick: function () { cutDone(true); } },
          { label: "No puedo / no sé cómo", onClick: function () { cutDone(false); } }
        ]);
      });
  }

  function cutDone(done) {
    addMsg("user", done ? "Sí, ya lo corté" : "No puedo / no sé cómo");
    botSay(done
      ? "Perfecto, eso ayuda mucho. Ahora describe la emergencia en una frase."
      : "No te preocupes, no toques nada. Describe la emergencia en una frase y te orientamos.")
      .then(function () { askProblem(true); });
  }

  function pickQuote() {
    state.kind = "Cotización";
    addMsg("user", "Cotización");
    askService(false);
  }

  /* ---------- step 2 ---------- */
  function askService(isEmergency) {
    setPill(isEmergency ? "Emergencia" : "Paso 2 de 5");
    botSay("¿Electricidad o plomería?")
      .then(function () {
        choiceRow([
          { label: "Electricidad", onClick: function () { pickService("Electricidad", isEmergency); } },
          { label: "Plomería", onClick: function () { pickService("Plomería", isEmergency); } }
        ]);
      });
  }
  function pickService(svc, isEmergency) {
    state.service = svc;
    addMsg("user", svc);
    askProblem(isEmergency);
  }

  /* ---------- step 3 ---------- */
  function askProblem(isEmergency) {
    setPill(isEmergency ? "Emergencia" : "Paso 3 de 5");
    botSay(isEmergency
      ? "Describe la emergencia en una frase."
      : "Describe el problema o envía una foto.")
      .then(function () {
        clearActions();
        var col = document.createElement("div");
        col.className = "bot-input-col";
        var ta = document.createElement("textarea");
        ta.id = "bot-problem";
        ta.rows = 3;
        ta.placeholder = "Ej.: Se sale agua del tubo bajo el fregadero";
        ta.setAttribute("aria-label", "Describe el problema");
        col.appendChild(ta);
        var fileRow = document.createElement("div");
        fileRow.className = "bot-input-row";
        var fileLabel = document.createElement("label");
        fileLabel.className = "choice-btn";
        fileLabel.style.textAlign = "center";
        fileLabel.style.cursor = "pointer";
        fileLabel.textContent = "Adjuntar foto (opcional)";
        var fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";
        fileInput.style.display = "none";
        fileInput.setAttribute("aria-label", "Adjuntar foto del problema (opcional)");
        fileLabel.appendChild(fileInput);
        fileRow.appendChild(fileLabel);
        col.appendChild(fileRow);
        var fileName = document.createElement("p");
        fileName.className = "bot-hint";
        fileName.textContent = "";
        fileInput.addEventListener("change", function () {
          fileName.textContent = fileInput.files.length
            ? "Foto adjunta: " + fileInput.files[0].name
            : "";
        });
        col.appendChild(fileName);
        var send = document.createElement("button");
        send.type = "button";
        send.className = "choice-btn choice-btn--volt";
        send.textContent = "Enviar descripción";
        send.addEventListener("click", function () {
          var v = ta.value.trim();
          if (!v) {
            ta.focus();
            ta.style.borderColor = "#FF3B30";
            return;
          }
          state.problem = v;
          addMsg("user", v + (fileInput.files.length ? "\n[Foto adjunta]" : ""));
          askPlace(isEmergency);
        });
        col.appendChild(send);
        actions.appendChild(col);
        ta.focus();
      });
  }

  /* ---------- step 4 ---------- */
  function askPlace(isEmergency) {
    setPill(isEmergency ? "Emergencia" : "Paso 4 de 5");
    botSay(isEmergency
      ? "¿En qué colonia estás?"
      : "Perfecto. ¿En qué colonia estás? ¿Y en qué horario te conviene?")
      .then(function () {
        clearActions();
        var col = document.createElement("div");
        col.className = "bot-input-col";
        var l1 = document.createElement("label");
        l1.textContent = "Colonia";
        l1.setAttribute("for", "bot-colonia");
        var i1 = document.createElement("input");
        i1.type = "text";
        i1.id = "bot-colonia";
        i1.placeholder = "Ej.: Agua Santa";
        i1.autocomplete = "address-level2";
        col.appendChild(l1);
        col.appendChild(i1);
        if (!isEmergency) {
          var l2 = document.createElement("label");
          l2.textContent = "Horario preferido";
          l2.setAttribute("for", "bot-horario");
          var i2 = document.createElement("input");
          i2.type = "text";
          i2.id = "bot-horario";
          i2.placeholder = "Ej.: Hoy en la tarde";
          col.appendChild(l2);
          col.appendChild(i2);
        }
        var next = document.createElement("button");
        next.type = "button";
        next.className = "choice-btn choice-btn--volt";
        next.textContent = "Continuar";
        next.addEventListener("click", function () {
          var c = i1.value.trim();
          if (!c) { i1.focus(); i1.style.borderColor = "#FF3B30"; return; }
          state.colonia = c;
          state.horario = isEmergency ? "Lo antes posible" : (i2.value.trim() || "A convenir");
          addMsg("user", c + (isEmergency ? "" : " — " + state.horario));
          showSummary(isEmergency);
        });
        col.appendChild(next);
        actions.appendChild(col);
        i1.focus();
      });
  }

  /* ---------- step 5 ---------- */
  function showSummary(isEmergency) {
    setPill(isEmergency ? "Emergencia" : "Paso 5 de 5");
    var summary = "Resumen\n"
      + state.kind + " — " + state.service + "\n"
      + state.problem + "\n"
      + state.colonia + " — " + state.horario;
    botSay(summary + "\n¿Confirmo y envío tu " + (isEmergency ? "emergencia" : "cotización") + "?")
      .then(function () {
        clearActions();
        var row = document.createElement("div");
        row.className = "choice-row";
        var send = document.createElement("button");
        send.type = "button";
        send.className = "choice-btn choice-btn--volt";
        send.textContent = isEmergency ? "Enviar por WhatsApp" : "Enviar por WhatsApp";
        send.addEventListener("click", function () { endState(isEmergency); });
        row.appendChild(send);
        var call = document.createElement("a");
        call.className = "choice-btn choice-btn--call";
        call.href = PHONE_TEL;
        call.textContent = "Llamar ahora";
        call.style.display = "flex";
        call.style.alignItems = "center";
        call.style.justifyContent = "center";
        call.style.textDecoration = "none";
        row.appendChild(call);
        actions.appendChild(row);
      });
  }

  function endState(isEmergency) {
    addMsg("user", "Enviar por WhatsApp");
    botSay("Listo. Tu solicitud quedó registrada con estos datos. Te contactaremos por WhatsApp para confirmar tu cotización.")
      .then(function () {
        addSys("Demostración interactiva — este mensaje no se envió. En el bot real, tu solicitud llegaría a " + BUSINESS_NAME + " por WhatsApp.");
        setPill("Completado");
        clearActions();
        var row = document.createElement("div");
        row.className = "choice-row";
        var again = document.createElement("button");
        again.type = "button";
        again.className = "choice-btn";
        again.textContent = "Empezar de nuevo";
        again.addEventListener("click", start);
        row.appendChild(again);
        var call = document.createElement("a");
        call.className = "choice-btn choice-btn--call";
        call.href = PHONE_TEL;
        call.textContent = "Llamar ahora";
        call.style.display = "flex";
        call.style.alignItems = "center";
        call.style.justifyContent = "center";
        call.style.textDecoration = "none";
        row.appendChild(call);
        actions.appendChild(row);
      });
  }

  if (restartBtn) restartBtn.addEventListener("click", start);
  start();
})();

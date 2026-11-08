/* Shared behaviour: mobile nav, FAQ accordion, reveal-on-scroll,
   marquee duplication, contact-form validation + success state.
   BUSINESS_NAME = "Servicios Técnicos Integrados" (one swappable constant) */
(function () {
  "use strict";
  var BUSINESS_NAME = "Servicios Técnicos Integrados";

  /* --- mobile nav --- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") nav.classList.remove("open");
    });
  }

  /* --- FAQ accordion --- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q");
    var a = item.querySelector(".faq-a");
    if (!q || !a) return;
    q.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(function (other) {
        other.classList.remove("open");
        other.querySelector(".faq-a").style.maxHeight = null;
        other.querySelector(".faq-q").setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("open");
        a.style.maxHeight = a.scrollHeight + "px";
        q.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* --- reveal on scroll (rest state fully visible if JS/IO fails) --- */
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll(".reveal");
  if (!reduced && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* --- marquee: duplicate track content for a seamless loop --- */
  var track = document.getElementById("marquee-track");
  if (track) track.innerHTML += track.innerHTML;

  /* --- contact form --- */
  var form = document.getElementById("contact-form");
  if (form) {
    var success = document.getElementById("form-success");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = true;
      function check(field, test, msg) {
        var wrap = field.closest(".field");
        var ok = test(field.value.trim());
        wrap.classList.toggle("invalid", !ok);
        if (!ok) valid = false;
        return ok;
      }
      check(document.getElementById("cf-nombre"), function (v) { return v.length >= 2; });
      check(document.getElementById("cf-telefono"), function (v) { return v.replace(/[^0-9]/g, "").length >= 10; });
      check(document.getElementById("cf-servicio"), function (v) { return v !== ""; });
      check(document.getElementById("cf-mensaje"), function (v) { return v.length >= 10; });
      var consent = document.getElementById("cf-consent");
      var consentWrap = consent.closest(".consent");
      if (!consent.checked) {
        valid = false;
        consentWrap.style.outline = "2px solid var(--error)";
        consentWrap.style.outlineOffset = "4px";
      } else {
        consentWrap.style.outline = "";
      }
      if (!valid) {
        var firstInvalid = form.querySelector(".field.invalid input, .field.invalid select, .field.invalid textarea");
        if (firstInvalid) firstInvalid.focus();
        return;
      }
      // Demo form: no backend wired yet — show success state, do not transmit.
      form.style.display = "none";
      if (success) {
        success.style.display = "block";
        success.setAttribute("tabindex", "-1");
        success.focus();
      }
    });
    // clear invalid state as the user types
    form.querySelectorAll("input, select, textarea").forEach(function (el) {
      el.addEventListener("input", function () {
        var wrap = el.closest(".field");
        if (wrap) wrap.classList.remove("invalid");
      });
    });
  }
})();

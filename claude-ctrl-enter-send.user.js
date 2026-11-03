// ==UserScript==
// @name            claude-ctrl-enter-send
// @namespace       https://github.com/KOTO28/claude-ctrl-enter-send
// @version         1.0.0
// @description     Changes claude.ai so that Enter inserts a line break and Ctrl+Enter (Command+Enter on Macintosh) sends the message.
// @description:ja  claude.aiでEnterを改行に、Ctrl+Enter(MacintoshではCommand+Enter)を送信に変更する。
// @match           https://claude.ai/*
// @run-at          document-start
// @grant           none
// @homepageURL     https://github.com/KOTO28/claude-ctrl-enter-send/
// @downloadURL     https://raw.githubusercontent.com/KOTO28/claude-ctrl-enter-send/main/claude-ctrl-enter-send.user.js
// ==/UserScript==

(() => {
  "use strict";

  // 自分で発火させた合成イベントを見分けるためのフラグ
  const SYNTHETIC = Symbol("ctrlEnterSynthetic");

  const isEditor = (el) =>
    el instanceof HTMLElement &&
    (el.tagName === "TEXTAREA" || el.isContentEditable);

  const fireEnter = (target, { shift = false } = {}) => {
    const ev = new KeyboardEvent("keydown", {
      key: "Enter",
      code: "Enter",
      shiftKey: shift,
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    // 古い判定(keyCode/which)を使うハンドラ向け
    Object.defineProperty(ev, "keyCode", { get: () => 13 });
    Object.defineProperty(ev, "which", { get: () => 13 });
    ev[SYNTHETIC] = true;
    target.dispatchEvent(ev);
  };

  const insertNewline = (target) => {
    if (target.tagName === "TEXTAREA") {
      // 履歴編集用の textarea: undo 履歴と React の state を保ったまま改行を入れる
      document.execCommand("insertText", false, "\n");
    } else {
      // 入力欄(ProseMirror): Shift+Enter 相当で改行
      fireEnter(target, { shift: true });
    }
  };

  window.addEventListener(
    "keydown",
    (e) => {
      if (e[SYNTHETIC]) return; // 自前の合成イベントは素通し
      if (e.key !== "Enter") return;
      if (e.isComposing || e.keyCode === 229) return; // IME変換確定の Enter は触らない

      const target = e.target;
      if (!isEditor(target)) return;

      const mod = e.ctrlKey || e.metaKey;

      if (mod && !e.shiftKey && !e.altKey) {
        // Ctrl+Enter → 素の Enter として渡して送信させる
        e.preventDefault();
        e.stopImmediatePropagation();
        fireEnter(target);
      } else if (!mod && !e.shiftKey && !e.altKey) {
        // Enter 単体 → 改行
        e.preventDefault();
        e.stopImmediatePropagation();
        insertNewline(target);
      }
      // Shift+Enter などその他の組み合わせは元の動作のまま
    },
    true, // キャプチャ段階で claude.ai 側のハンドラより先に処理
  );
})();

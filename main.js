const { Plugin, Notice } = require("obsidian");

module.exports = class ImeFormatGuard extends Plugin {
  onload() {
    this.pending = null;
    this.stats = { deferred: 0, applied: 0, cancelled: 0 };
    for (const id of ["editor:toggle-bold", "editor:toggle-italics"]) {
      const command = this.app.commands.commands[id];
      if (!command?.editorCallback) continue;
      const original = command.editorCallback;
      const plugin = this;
      const wrapped = function (editor, context) {
        if (plugin.pending) return;
        const cm = editor?.cm;
        if (!cm || !(cm.composing || cm.compositionStarted)) {
          return original.call(this, editor, context);
        }
        plugin.defer(editor, context, original, this);
      };
      command.editorCallback = wrapped;
      this.register(() => {
        if (command.editorCallback === wrapped) command.editorCallback = original;
      });
    }
    this.register(() => this.pending?.cancel());
  }

  defer(editor, context, original, receiver) {
    const cm = editor.cm;
    const dom = cm.contentDOM;
    const win = dom.ownerDocument.defaultView;
    const initialFile = context?.file;
    let timer, watchdog;
    const cleanup = () => {
      dom.removeEventListener("compositionend", onEnd);
      win.clearTimeout(timer);
      win.clearTimeout(watchdog);
      this.pending = null;
    };
    const cancel = () => { cleanup(); this.stats.cancelled++; };
    const finish = () => {
      if (cm.composing || cm.compositionStarted) return;
      if (!dom.isConnected || !cm.hasFocus ||
          this.app.workspace.activeEditor?.editor !== editor || context?.file !== initialFile) {
        cancel();
        return;
      }
      cleanup();
      original.call(receiver, editor, context);
      this.stats.applied++;
    };
    // 포커스·문서·기본 키 입력을 건드리지 않고 실제 IME 확정 처리가 끝나기를 기다립니다.
    const onEnd = () => {
      win.clearTimeout(timer);
      timer = win.setTimeout(finish, 0);
    };
    dom.addEventListener("compositionend", onEnd);
    watchdog = win.setTimeout(() => {
      cancel();
      new Notice("한글 입력이 아직 확정되지 않았습니다. 오른쪽 방향키를 누른 뒤 서식을 적용해 주세요.");
    }, 1500);
    this.pending = { cancel };
    this.stats.deferred++;
  }
};

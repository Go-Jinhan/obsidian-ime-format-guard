const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function fixture(composing = true) {
  const timers = new Map(), listeners = new Map(), calls = [], notices = [];
  let nextTimer = 0;
  const win = {
    setTimeout(fn, ms) { const id = ++nextTimer; timers.set(id, { fn, ms }); return id; },
    clearTimeout(id) { timers.delete(id); },
  };
  const dom = {
    isConnected: true, ownerDocument: { defaultView: win },
    addEventListener(type, fn) { listeners.set(type, fn); },
    removeEventListener(type, fn) { if (listeners.get(type) === fn) listeners.delete(type); },
  };
  const cm = { composing, compositionStarted: composing, hasFocus: true, contentDOM: dom };
  const editor = { cm }, context = { file: { path: 'test.md' } };
  const commands = Object.fromEntries(['bold', 'italics'].map(format => [
    `editor:toggle-${format}`, { editorCallback: (e, c) => calls.push({ format, editor: e, context: c }) },
  ]));
  const originals = Object.fromEntries(Object.entries(commands).map(([id, c]) => [id, c.editorCallback]));
  class Plugin {
    constructor() { this.cleanups = []; }
    register(fn) { this.cleanups.push(fn); }
  }
  const sandbox = { module: { exports: {} }, require(name) {
    assert.equal(name, 'obsidian');
    return { Plugin, Notice: class { constructor(text) { notices.push(text); } } };
  } };
  vm.runInNewContext(fs.readFileSync(require.resolve('../main.js'), 'utf8'), sandbox);
  const plugin = new sandbox.module.exports();
  plugin.app = { commands: { commands }, workspace: { activeEditor: { editor } } };
  plugin.onload();
  return {
    plugin, cm, dom, editor, context, commands, originals, calls, notices, timers, listeners,
    invoke(format = 'bold') { commands[`editor:toggle-${format}`].editorCallback(editor, context); },
    end() { cm.composing = cm.compositionStarted = false; listeners.get('compositionend')?.(); },
    run(ms) { for (const [id, timer] of [...timers]) if (timer.ms === ms) { timers.delete(id); timer.fn(); } },
    unload() { for (const cleanup of plugin.cleanups) cleanup(); },
  };
}

test('일반 입력은 기존 명령을 즉시 실행한다', () => {
  const f = fixture(false); f.invoke();
  assert.equal(f.calls.length, 1); assert.equal(f.timers.size, 0);
});
for (const format of ['bold', 'italics']) test(`${format}: 실제 조합 종료와 이벤트 처리 이후에만 실행한다`, () => {
  const f = fixture(); f.invoke(format);
  assert.equal(f.calls.length, 0);
  f.end(); assert.equal(f.calls.length, 0);
  f.run(0); assert.equal(f.calls.length, 1); assert.equal(f.calls[0].format, format);
  assert.equal(f.calls[0].editor, f.editor); assert.equal(f.calls[0].context, f.context);
  assert.equal(f.timers.size, 0); assert.equal(f.listeners.size, 0);
});
test('composing이 아직 false인 조합 시작 상태도 기다린다', () => {
  const f = fixture(); f.cm.composing = false; f.invoke();
  assert.equal(f.calls.length, 0); f.end(); f.run(0); assert.equal(f.calls.length, 1);
});
test('대기 중 반복 호출은 한 번만 적용한다', () => {
  const f = fixture(); f.invoke(); f.invoke(); f.invoke('italics');
  f.end(); f.run(0); assert.equal(f.calls.length, 1);
});
test('조합이 끝나지 않으면 적용 없이 시간 초과로 정리한다', () => {
  const f = fixture(); f.invoke(); f.run(1500);
  assert.equal(f.calls.length, 0); assert.equal(f.notices.length, 1);
  assert.equal(f.listeners.size, 0); assert.equal(f.plugin.pending, null);
});
for (const [name, change] of [
  ['다른 편집기로 이동', f => { f.plugin.app.workspace.activeEditor = { editor: {} }; }],
  ['같은 편집기에서 다른 파일 열기', f => { f.context.file = { path: 'other.md' }; }],
  ['편집기 포커스 해제', f => { f.cm.hasFocus = false; }],
  ['편집기 제거', f => { f.dom.isConnected = false; }],
]) test(`${name} 시 대기 중인 서식을 취소한다`, () => {
  const f = fixture(); f.invoke(); change(f); f.end(); f.run(0);
  assert.equal(f.calls.length, 0); assert.equal(f.plugin.pending, null);
});
test('비활성화 시 명령과 이벤트·타이머를 복원한다', () => {
  const f = fixture(); f.invoke(); f.end(); f.unload(); f.run(0);
  for (const id of Object.keys(f.commands)) assert.equal(f.commands[id].editorCallback, f.originals[id]);
  assert.equal(f.calls.length, 0); assert.equal(f.timers.size, 0); assert.equal(f.listeners.size, 0);
});
test('나중에 적용된 다른 플러그인의 명령 래퍼는 덮어쓰지 않는다', () => {
  const f = fixture(), later = () => {};
  f.commands['editor:toggle-bold'].editorCallback = later; f.unload();
  assert.equal(f.commands['editor:toggle-bold'].editorCallback, later);
});
test('명령이 없으면 플러그인 로드가 실패하지 않는다', () => {
  const f = fixture(); f.unload(); delete f.commands['editor:toggle-bold'];
  assert.doesNotThrow(() => f.plugin.onload());
});
test('조합 종료가 반복되어도 서식은 한 번만 실행한다', () => {
  const f = fixture(); f.invoke(); f.end(); f.end(); f.run(0);
  assert.equal(f.calls.length, 1); assert.equal(f.timers.size, 0);
});

function Vue(opt = {}) {
  const { queueMicrotask, document, Reflect, Object, JSON: { stringify } } = window;
  let _active;
  const _deps = {};
  const $refs = {};
  const $el = document.querySelector(opt.el) ?? document;
  const This = Object.assign(new Proxy({ $el, $refs }, {
    get: (...args) => [Reflect.get(...args), (_deps[args[1]] ??= new Set()).add(_active)][0],
    set: (...args) => [Reflect.set(...args), queueMicrotask(() => _deps[args[1]]?.forEach(f => f?.()))][0],
  }), opt.methods, opt.data);
  let thisState = stringify(This);
  const thisKeyRex = RegExp(Object.keys(This).map(k => `(?<![\\w$])${k}(?![\\w$])`).join('|').replace(/\$/g, '\\$'), 'g');
  const infuse = (raw, preCode = 'return ') => Function('$event', preCode + raw.trim().replace(thisKeyRex, k => 'this.' + k)).bind(This);
  const effect = (fn) => (_active = fn, fn());
  const compiler = (node, walker = document.createTreeWalker(node)) => {
    const { nodeType, data: tem } = node;
    if (nodeType == Node.ELEMENT_NODE) for (const { name, value: raw } of node.attributes) {
      const bindName = name.slice(1);
      if (name[0] == '@')
        node.addEventListener(bindName, /[^\s\w$]/.test(raw) ? infuse(raw, '') : This[raw.trim()]?.bind(This));
      if (name[0] == ':')
        effect(() => node.setAttribute(bindName, node[bindName] = infuse(raw)()));
      if (name == 'ref')
        This.$refs[raw] = node;
    }
    if (nodeType == Node.TEXT_NODE)
      effect(() => node.data = tem.replace(/\{\{(.*?)\}\}/gs, (_, raw) => infuse(raw)()));
    if (walker.nextNode())
      compiler(walker.currentNode, walker);
  };
  for (const [key, fn] of Object.entries(opt.watch ?? {})) {
    let oldVal = This[key];
    _deps[key].add(() => {
      const val = This[key];
      if (val == oldVal) return;
      fn.call(This, val, oldVal);
      oldVal = val;
    });
  }
  opt.created?.call(This);
  compiler($el);
  queueMicrotask(() => {
    _active = () => {
      if (thisState == (thisState = stringify(This))) return;
      queueMicrotask(() => {
        opt.updated?.call(This);
        setTimeout(() => (thisState = null));
      });
    };
  });
  opt.mounted?.call(This);
};
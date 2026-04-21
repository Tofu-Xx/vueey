interface Opt {
  el?: keyof HTMLElementTagNameMap
  methods?: () => any
  data?: any
  watch?: Record<string, (...args: any[]) => any>
  created?: () => any
  updated?: () => any
  mounted?: () => any
}
export default function Vue(opt: Opt = {}) {
  let _active: () => void
  const _deps: any = {}
  const $refs = {}
  const $el = opt.el ? document.querySelector(opt.el) : document
  const This = Object.assign(new Proxy({ $el, $refs }, {
    get: (...args) => {
      _deps[args[1]] ??= new Set()
      _deps[args[1]].add(_active)
      return Reflect.get(...args)
    },
    set: (...args) => {
      queueMicrotask(() => {
        _deps[args[1]]?.forEach((f: () => any) =>
          f?.(),
        )
      },
      )
      return Reflect.set(...args)
    },
  }), opt.methods, opt.data)
  let thisState = JSON.stringify(This)
  const thisKeyRex = new RegExp(Object.keys(This).map(k => `(?<![\\w$])${k}(?![\\w$])`).join('|').replace(/\$/g, '\\$'), 'g')
  const infuse = (raw: string, preCode = 'return ') => new Function('$event', preCode + raw.trim().replace(thisKeyRex, k => `this.${k}`)).bind(This)
  const effect = (fn: () => void) => {
    _active = fn
    return fn()
  }
  const compiler = (node: any, walker = document.createTreeWalker(node)) => {
    const { nodeType, data: tem } = node
    if (nodeType === Node.ELEMENT_NODE) {
      for (const { name, value: raw } of node.attributes) {
        const bindName = name.slice(1)
        if (name[0] === '@')
          node.addEventListener(bindName, /[^\s\w$]/.test(raw) ? infuse(raw, '') : This[raw.trim()]?.bind(This))
        if (name[0] === ':')
          effect(() => node.setAttribute(bindName, node[bindName] = infuse(raw)()))
        if (name === 'ref')
          This.$refs[raw] = node
      }
    }
    if (nodeType === Node.TEXT_NODE)
      effect(() => node.data = tem.replace(/\{\{(.*?)\}\}/gs, (_: unknown, raw: string) => infuse(raw)()))
    if (walker.nextNode())
      compiler(walker.currentNode, walker)
  }
  for (const [key, fn] of Object.entries(opt.watch ?? {})) {
    let oldVal = This[key]
    _deps[key].add(() => {
      const val = This[key]
      if (val === oldVal)
        return
      fn.call(This, val, oldVal)
      oldVal = val
    })
  }
  opt.created?.call(This)
  compiler($el)
  queueMicrotask(() => {
    _active = () => {
      const oldState = thisState
      thisState = JSON.stringify(This)
      if (thisState === oldState)
        return
      queueMicrotask(() => {
        opt.updated?.call(This)
        setTimeout(() => (thisState = ''))
      })
    }
  })
  opt.mounted?.call(This)
};

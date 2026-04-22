interface Opt {
  el?: keyof HTMLElementTagNameMap
  data?: Obj
  methods?: Record<PropertyKey, Fn>
  watch?: Record<PropertyKey, (val: unknown, oldVal: unknown) => void>
  created?: Fn
  mounted?: Fn
  updated?: Fn
}
export default function Vue(this: any, opt: Opt = {}) {
  let _active: Fn
  const _deps: Record<PropertyKey, Set<Fn>> = {}
  const $refs: Obj<Element> = {}
  const $el = document.querySelector(opt.el ?? 'body') ?? document.body
  const This = Object.assign(new Proxy({ $el, $refs }, {
    get: (...args) => {
      _deps[args[1]] ??= new Set()
      _deps[args[1]].add(_active)
      return Reflect.get(...args)
    },
    set: (...args) => {
      queueMicrotask(() => {
        _deps[args[1]]?.forEach(f =>
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
  const effect = (fn: Fn) => {
    _active = fn
    return fn()
  }
  const compiler = (node: Node, walker = document.createTreeWalker(node)) => {
    if (node instanceof Element) {
      for (const { name, value } of node.attributes) {
        if (name === 'ref') {
          This.$refs[value] = node
        }
        else {
          const bindName = name.slice(1)
          if (name[0] === '@') {
            node.addEventListener(bindName, /[^\s\w$]/.test(value) ? infuse(value, '') : This[value.trim()]?.bind(This))
          }
          if (name[0] === ':') {
            effect(() => node.setAttribute(bindName, /* node[bindName] =  */infuse(value)()))
          }
        }
      }
    }
    if (node instanceof Text) {
      const tem = node.data
      effect(() => node.data = tem.replace(/\{\{(.*?)\}\}/gs, (_: unknown, raw: string) => infuse(raw)()))
    }
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
  effect(() => Object.assign(this, This))
};

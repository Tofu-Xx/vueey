<h1 align="center">vueey</h1>

<p align="center">
  <a href="./README.md">English</a> | <b>简体中文</b>
</p>

本项目将尽可能多还原出Vue核心功能，
并尽量保持打包后的代码体积在 **1024** 字节以内。   

### 🎉 已有 的 功能

```ts
interface Options {
  el?: string 
  data?: object
  methods?: Record<string, Function>
  watch?: Record<string, (val: any, oldVal: any) => void>
  created?: Function
  mounted?: Function
  updated?: Function
}
```

 `{{ }}`
 `:attr=""`
 `@event=""`
 `ref=""`
 `this.$refs`
 `this.$el`

### 🎯 展示 的 用例
- [opt_drill](./examples/opt_drill.html)
- [tem_drill](./examples/tem_drill.html)
- [lifecycle_drill](./examples/lifecycle_drill.html)


if (!/pnpm/.test(process.env.npm_execpath || '')) {
  console.warn(
    `\u001b[33m本仓库必须使用 pnpm 作为包管理器，请先安装 pnpm：npm i -g pnpm\u001b[39m\n`
  )
  process.exit(1)
}

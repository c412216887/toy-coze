<template>
  <div class="default-layout">
    <nav class="default-layout__sidebar">
      <RouterLink to="/">首页</RouterLink>
      <RouterLink to="/workflow">工作流</RouterLink>
      <RouterLink to="/agent">Agent</RouterLink>
      <RouterLink to="/knowledge">知识库</RouterLink>
      <RouterLink to="/settings">设置</RouterLink>
    </nav>
    <main class="default-layout__main">
      <RouterView />
    </main>
  </div>
</template>

<style lang="scss" scoped>
.default-layout {
  display: flex;
  height: 100vh;

  &__sidebar {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 200px;
    padding: 16px;
    border-right: 1px solid #e5e7eb;
  }

  &__main {
    flex: 1;
    overflow: auto;
  }
}
</style>

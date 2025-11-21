# Rei Sidebar（Chrome 插件侧栏原型）

## 项目简介
- 目标：模拟 Arc 浏览器的侧栏体验，集中展示/管理当前窗口的标签页与分组，并保留关闭记录（幽灵标签）。
- 技术栈：React 18、Tailwind CSS 3、Vite 构建，图标使用 `lucide-react`。
- 运行环境：优先在 Chrome 扩展上下文使用 `chrome.tabs`、`chrome.tabGroups`、`chrome.storage`；本地开发无扩展 API 时自动回退到内置 mock 标签数据。
- 空间（Space）：内置“默认空间”，用户可创建多套 Space，将分组归类后按 Space 过滤侧边栏视图。

## 快速开始
- 安装依赖：`npm install`
- 开发调试：`npm run dev`（Vite，使用 mock 数据可直接预览）
- 生产构建：`npm run build`（产物输出到 `dist/`，后续可配合 Manifest 打包扩展）
- 预览产物：`npm run preview`

## 目录速览
- `src/main.jsx`：入口，挂载 `ThemeProvider` 后渲染 `App`。
- `src/App.jsx`：仅渲染侧栏组件 `<Sidebar />`。
- 组件
  - `src/components/Sidebar.jsx`：整体布局与交互中枢（搜索占位、Pinned、分组/收件箱、底部控制、右键菜单、确认弹窗）。
- `src/components/TabGroup.jsx`：分组折叠、颜色标记，收件箱可按 host 分块显示。
- `src/components/TabItem.jsx`：单标签项，支持幽灵态样式与关闭按钮。
- `src/components/PinnedSection.jsx`：固定标签九宫格展示。
- `src/components/ContextMenu.jsx`：右键菜单（Pin/Unpin、Remove）。
- `src/components/ConfirmationModal.jsx`：删除确认弹窗。
- `src/components/SpaceSelector.jsx`：底部彩色圆点选择器，新增/重命名/删除 Space。
- 状态与主题
  - `src/hooks/useTabs.js`：加载/同步标签与分组，监听 `chrome.tabs`/`chrome.tabGroups` 事件，支持切换、关闭、移除、清理幽灵、Pin/Unpin、分组折叠。
  - `src/context/ThemeContext.jsx`：暗/亮主题切换，`localStorage` 持久化，默认暗色。
- 样式
  - `src/index.css`：Tailwind 基础，定义 `--arc-*` 颜色变量与细滚动条。
  - `tailwind.config.js`：`darkMode: 'class'`，暴露 `arc` 颜色别名。

## 关键行为
- 初始化：`useTabs` 读取 `chrome.storage.local` 的 `savedTabs/savedGroups`，再与当前窗口实际标签/分组合并，缺失者标记为幽灵。
- 持久化：`tabs` 或 `groups` 变化即写回 `chrome.storage.local`（保存 id/title/url/favIconUrl/isGhost/isPinned/groupId 等核心字段）。
- 事件监听：注册 `chrome.tabs`/`chrome.tabGroups` 的 create/update/remove/activate，自动同步 UI；无扩展 API 时仅使用内存状态。
- 操作：
  - 切换/激活：`switchToTab`，幽灵标签会重新创建并替换自身。
  - 关闭：`closeTab` 对真实标签调用 `chrome.tabs.remove`，幽灵态不再处理。
  - 移除：`removeTab` 从列表彻底删除，若是真实标签也关闭浏览器标签。
  - 清理幽灵：`clearGhosts` 过滤掉所有幽灵标签。
  - Pin/Unpin：`togglePin` 切换固定状态；`PinnedSection` 与列表分区展示。
  - 分组折叠：`toggleGroupCollapse` 本地记录并在可用时同步到 Chrome 分组。

## Space 概念与用法
- 数据模型：`useTabs` 持有 `spaces` 数组与 `activeSpaceId`，持久化字段为 `savedSpaces`、`activeSpaceId`；每个分组新增 `spaceId`（默认 `"default"`）。
- 过滤规则：侧栏只显示当前 `activeSpaceId` 下的分组；切回默认空间时，同时展示默认空间与未绑定/丢失空间的分组以避免“孤儿”分组丢失。
- 底部入口：左下角彩色圆点即 Space 列表，当前 Space 为实心大圆，其他为浅色小圆；点击切换空间。
- 创建：点击 `+` 打开颜色选择器，选色即创建新 Space，名称默认 `Space N`，可右键（长按触发的上下文菜单）重命名。
- 重命名/删除：在圆点上右键打开菜单，重命名或删除。默认空间不可删除；删除任意自定义空间会将其分组迁移回默认空间并自动切换到默认空间。
- 分组归类：在任意分组内的标签右键菜单选择 “Move Group to Space”，即可将该分组切换到指定 Space。
- 颜色：Space 颜色用于圆点填充与切换时的视觉区分，不影响分组颜色。

## UI 与交互梳理
- 顶部：URL/搜索输入占位（暂未接入实际逻辑）。
- Pinned：六列网格，激活高亮；幽灵置灰并灰度处理。
- 分组/收件箱：分组头可折叠，左侧彩条；收件箱按域名块展示。
- 右键菜单：Pin/Unpin、Remove（彻底删除）；点击外部自动关闭。
- 底部：Space 选择器（彩色圆点+新增按钮）、新建标签、主题切换（Sun/Moon）、清除幽灵、设置入口占位。
- 弹窗：移除前的二次确认。

## 扩展集成提示
- 仓库尚未包含 `manifest.json`；若要打包为 Chrome 插件需补充 Manifest（建议 Manifest V3）并指定入口页面指向 `dist/index.html` 或嵌入到侧边面板。
- 若需持久存储更多元数据或跨窗口同步，可继续使用 `chrome.storage` 的同步区域（需注意配额）。

## 待办/改进建议
- 清理 `useTabs` 导出中重复的 `clearGhosts` 字段。
- 为搜索框与设置按钮接入实际行为（如过滤、本地命令/跳转、偏好设置面板）。
- 依据 `tab.index` 或 Chrome 原生顺序渲染分组与未分组标签，提升与浏览器一致性。
- 增加错误反馈 UI（取代 console）及更贴近 Arc 的动效/样式细节。

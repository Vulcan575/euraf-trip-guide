# 🌸 姐姐的亚欧非漫游指南

从新疆出发，环游亚欧非 14 个区域、55 国、125 城的旅行规划工具。
纯静态网页，无依赖、无构建，双击即可使用。

## ✨ 功能

- **选城市**：125 城数据（433 景点 / 30 徒步路线 / 250 家青旅 / 美食 / 贴士 / 最佳季节），14 区域筛选 + 搜索城市/国家，区域标题配真实风景背景
- **清单栏**：想去的地方、美食、购物、签证材料、装备、健康、安全等 8 类清单
- **城市攻略**：选中城市的完整攻略卡片
- **签证助手**：根据行程自动生成签证时间线和签证要求表
- **我的行程**：行程统计、足迹打卡、每日日程、一键分享到剪贴板
- **预算规划**：基础预算（食宿+市内）+ 城际交通 + 大额体验估算
- **行前贴士**：语言短语速查、电源插头、时区、领保热线 12308
- **暗色模式**：右上角 🌙/☀️ 一键切换，自动记忆

数据保存在浏览器 localStorage，可**导出/导入 JSON 备份**，支持一键重置。

## 📁 项目结构

```
├── index.html            # 页面骨架
├── css/style.css         # 全部样式
├── js/
│   ├── data-cities.js    # 城市数据（加城市只改这里）
│   ├── data-meta.js      # 国家信息/语言短语/交通费用
│   ├── data-checklist.js # 默认清单
│   └── app.js            # 应用逻辑
└── README.md
```

## 🌐 线上地址

**https://sister-trip-guide.pages.dev**（Cloudflare Pages 托管，免费）

## 🚀 本地使用

直接双击 `index.html` 用浏览器打开即可，无需服务器。

## ☁️ 部署到 Cloudflare Pages（免费）

1. **创建 GitHub 仓库**（Public）：
   打开 [github.com](https://github.com)，右上角 `+` → New repository，
   命名如 `sister-trip-guide`，勾选 Public，Create repository。

2. **上传代码**（命令行方式）：
   ```bash
   cd 项目文件夹
   git init
   git add .
   git commit -m "first commit"
   git remote add origin https://github.com/你的用户名/sister-trip-guide.git
   git branch -M main
   git push -u origin main
   ```

3. **Cloudflare Pages 部署**：
   - 打开 [dash.cloudflare.com](https://dash.cloudflare.com)，左侧 Pages → Create a project
   - Connect to GitHub，授权后选择 `sister-trip-guide` 仓库
   - Framework preset 选 **None**
   - Build command 留空
   - **Build output directory 留空**（自动用根目录）
   - Save and Deploy，等待 1 分钟，得到 `https://sister-trip-guide.pages.dev`

4. **以后更新**：改完代码后 `git add . && git commit -m "更新" && git push`，Cloudflare 自动重新部署。

## 🏙️ 如何添加城市

编辑 `js/data-cities.js`，按已有格式追加一行即可：

```js
"城市名":{c:"国家",r:"区域",v:"签证",a:["景点:描述","景点:描述"],t:[],h:["青旅 ¥价格"],b:日均预算,tip:"贴士",f:"美食",best:"最佳月份"},
```

区域取值：`出发地 / 中亚 / 高加索 / 土耳其 / 巴尔干 / 欧洲 / 北非 / 中东 / 东北亚 / 东非 / 南非 / 南亚 / 东南亚`

## 📌 注意

- 签证信息（免签/电子签/落地签）会随政策变化，出发前请以官方信息为准
- 出行前在"中国领事"App 完成海外公民登记，紧急情况拨打 12308

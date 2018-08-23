# Stacktodo

### Live Demo

[点击这里前往](https://stacktodo.mak1t0.cc/)（HTTPS）

前端服务器由 Hostker 提供；后端服务器由 Google Cloud 提供，速度感人，游玩时请耐心稍候。

### 安装

<del>不推荐，有点麻烦。</del>

#### 检查清单

##### 后端原料

- Python 2.7 w/ pip and vitrualenv
- Django==1.8
- djangorestframework==3.3.3
- psycopg2
- django-cors-headers
- PostgreSQL

##### 前端原料

Just `npm i` please.

### 已实现功能

- 增加一个待办事项
- 删除一个待办事项
- 标记一个待办事项为已完成
- 编辑一个待办事项的具体内容
- 列出所有的待办事项
- 列表界面支持翻页
- 任务可选优先级
- 任务可选截止日期（expire date）
- 按不同属性对任务进行排序

### 预览 GIF

#### 添加任务

![添加任务](https://i.imgur.com/hgqhvHK.gif)

#### 删除任务

![删除任务](https://i.imgur.com/SNFWQJX.gif)

#### 更新任务

![更新任务](https://i.imgur.com/dZNnpt6.gif)

#### 任务排序

![任务排序](https://i.imgur.com/sWi0l8u.gif)

#### 改变状态、筛选、翻页及其他

![改变状态、筛选、翻页及其他](https://i.imgur.com/poDEfB0.gif)



### 后记

这是我第一次将 Django 与 React 这两个框架结合起来做东西，有了 DRF 的加持，RESTful API 开发十分便捷，更是对 Model 及其友好。之前我个人仍在开发中的 Golang C2C 电商平台后端在使用 MySQL ，始终没有机会体验 PostgreSQL，本次也终于从配置到上手使用体验了一遍 PostgreSQL。代码还存在很多值得修改结构和逻辑的地方，欢迎 Review。
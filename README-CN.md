## 介绍

这是一个针对Android的listview的一个下拉刷新和上拉加载的组件, 后续会增加ios版本

## 功能介绍

### 下拉刷新

#### 属性

- `pullHeight`: 下拉高度,默认:80
- `onRefresh(callback)`: 刷新函数, 此函数有个回调, 当执行回调的时候就说明刷新结束
- `statusTextObj` : 对应下拉的每个状态的显示文本,自定义

### 上拉加载

#### 属性

- `loadMoreHeight`: 上拉高度,默认:80
- `autoLoadMore`: 默认: false, 是否自动加载(不需要上拉就去加载),如果开始则意味着上拉失效
- `onLoadMore(callback)`: 如果没有该属性则不会去loadmore, 当`callback()`被执行的时候则说明loadmore结束, 当执行`callback(true)`, 说明全部数据已经加载完毕
- `loadMoreStatusTextObj`: 对应上拉的每个状态文本值, 用户可以自定义

### 完全支持ListView的属性

- 因为就是ListView

### 欢迎大家提 issues
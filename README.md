# hello-world

## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```

### Lints and fixes files
```
yarn lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).


# vueRouter实现原理

## 课程介绍

- Vue Router基础回顾
- Hash模式和History模式
- 模拟实现自己的Vue Router

### vueRouter基础回顾

#### 使用步骤

- 1. 注册路由插件

Vue.user是用来注册插件，如果里面是个函数，Vue.use会直接调用这个函数注册组件
如果传入的是个对象的话，他会调用传入对象的install方法来注册插件

- 2. 创建router对象

```js
//传递路由规则
const router = new VueRouter({
  routes
})
```

- 3. 注册router对象

```js
//会给vue实例注入$router和$route
new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
```

#### 动态路由

```js
  {
    path: '/blog',
    name: 'Blog',
    /*
    开启props，会把URL中的参数传递给组件
    在组件中通过props来接收URL参数
    */
    props:true,
    // 用户访问才会加载路由，实现懒加载，提高访问性能
    component: () => import('../views/Blog.vue')
  },
```



#### 嵌套路由

```js
  // 嵌套路由
  {
    path: '/',
    component: Layout,
    children: [
      {
        name: 'index',
        //path可以是相对路径也可以是绝对路径
        path: '',
        component: Index
      },
      {
        name: 'detail',
        path: 'detail/:id',
        props: true,
        component: () => import('@/views/Detail.vue')
      }
    ]
  }
```

#### 编程式导航

push

replace

go

#### Hash和History模式的区别

> 都是客户端实现路由的方式，不会向服务器发送请求

原理区别

- Hash模式是基于锚点，以及onhashChange事件，根据路径重现页面上的内容

- History模式是基于HTML5中的History API

  - history.pushState() IE10以后才支持，history.push()的区别是，push会让路径发生变化，会向服务器发生请求。pushState不会向服务器发生请求，只会改变浏览器中的地址，并且把地址记录到历史记录，可以实现客户端路由
  - history.replaceState()，不会记录到历史记录，只会覆盖当前状态

  

#### History模式的使用

- History需要服务器的支持
- 单页应用中，服务端不存在http://www.testurl.com/login这样的地址会返回找不到该页面
- 在服务器端应该除了静态资源外都返回单页面应用的index.html

nodeJs模式下

> 注册处理history模式的中间件,app.use(history)

nginx服务器配置

```conf
# try_files 试着访问文件当前浏览器地址对应的文件 $url 是当前请求的路径 找到后接着往后找 $url/ 是$url文件夹下对应的首页 找到则返回找不到则 返回/index.html
try_files $url $url/ /index.html
```

## VueRouter实现原理

### Vue构建版本

- 运行时版：不支持template模板，消炎药打包的时候提前编译
- 完整版：包含运行时和编译器，体积比运行时版大10K左右，程序运行的时候把模板转换成render函数

### Vue前置知识

- 插件
- 混入
- Vue.observable()
- 插槽
- render函数
- 运行时和完整版的Vue

### Hash模式

- URL中#后面的内容作为路径地址，可以使用location.href改变地址栏地址，不会向服务器发生请求，会记录到浏览器历史记录中
- 监听hashchange事件
- 根据当前路由地址找到对应组件重新渲染

### History模式
- 通过history.pushState()方法改变地址栏，history.pushState并把访问路径记录到访问历史中，不会向服务器发送请求
- 通过监听popstate事件可以监听到浏览器历史的变化，在popstate中可以记录改变后的地址，调用history.pushState和history.replaceState不会触发该事件，调用go和back改回被触发
- 根据当前路由地址找到对应组件重新渲染

## Vue Router模式实现

### 类中的成员

- 名称VueRouter

- 属性

  - options：记录构造函数中传入的对象、路由规则
  - data：是个对象，有个current属性，用来记录当前路由地址。data是个响应式对象，通过vue.observe方法来实现
  - routeMap：用来记录路由和组件的对应关系，我们会把路由规则解析到routeMap中

- 方法
	- Constructor(Options):VueRouter对外公开的方法。构造函数方法，初始化属性和方法
	- _install():void：静态的方法。用来实现插件vue插件机制
	- init():void对外公开的方法。用于调用以下三个方法
	- initEvent():void对外公开的方法。用来注册popstate方法，监听浏览器历史的变化
	- createRouteMap():void对外公开的方法。初始化routeMap属性
	- initCompoents(Vue):void对外公开的方法。创建router-link和router-view组件

### _install实现

- 判断插件是否是已经被安装
- 把Vue构造函数记录到全局变量中，vue实例方法中要用到Vue的构造函数，例如：使用功能vue.conponent创建router-link等组件
- 把创建实例时传入的router对象注入到所有vue实例上，$router就是在这里注入的，所有的组件也都是vue的实例

```js
// install 接收两个参数，一个是Vue构造函数，一个是可选选项对象
    static install(Vue) {
        //- 判断插件是否是已经被安装
        if(VueRouter.install.installed){
            return
        }
        VueRouter.install.installed = true
        //- 把Vue构造函数记录到全局变量中
        _Vue = Vue
        //- 把创建实例时传入的router对象注入到所有vue实例上
        /**
         * 混入
         * 所有的实例包括组件都会去执行这个钩子函数
         * 给所有的实例设置一个选项
         */
        _Vue.mixin({
            // 所有的组件都有一个beforeCreate钩子，所以会被执行很多次
            beforeCreate() {
                // 所以要判断一下实例中的this.$options中是否有router属性
                // 如果不是组件
                if(this.$options.router){
                    _Vue.prototype.$router = this.$options.router
                }
                
            },
        })
    }
```

### 构造函数

```js
    constructor(options) {
        this.options = options
        this.routeMap = {}
        //Vue.observable用于创建响应式对象,可以直接用在渲染函数或者计算属性里面
        this.data = _Vue.observable({
            current:'/'//用于存储当前的路有地址，默认情况是/
        })
    }
```

### createRouteMap

> 用于把构造函数中传过来的路由规则解析到routeMap中，键是路由地址，值是对应的组件，当路由发生变化时比较方便的将组件渲染到视图

```js
    createRouteMap() {
        //遍历所有的路有规则，把路由规则以键值对的方式存储到routeMap中
        this.options.routes.forEach(route => {
            this.routeMap[route.path] = route.component
        })
    }
```

### initComponents

> 创建router-link和router-view组件

> 当插件注册完成的时候立即调用init初始化的方法

```js
initComponents(Vue) {
        // 传递这个Vue参数的目的是减少和外部的依赖，最终是要创建一个超链接
        /**
         * 使用Vue.component创建组件
         * props用于接收参数
         * slot是插槽
         */
        Vue.component('router-link', {
            props: {
                to: String
            },
            template: '<a :href="to"><slot></slot></a>'
        })

    }
```

router-view相当于一个占位符

```js
        const self = this
        //创建router-view
        Vue.component('router-view', {
            render(h) {
                // 获取当前路由地址对应的组件
                const componnet = self.routeMap[self.data.current]
                //h函数用于返回虚拟DOM，h函数可以直接把组件返回成虚拟DOM
                return h(componnet)
            }
        })
```

### initEvent

用于注册popsate事件

```js
    initEvent() {
        window.addEventListener('popstate', () => {
            //因为使用了箭头函数，所以这里的this指向的是initEvent中的箭头函数也就是VueRouter
            this.data.current = window.location.pathname
        })
    }
```



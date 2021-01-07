let _Vue = null

export default class VueRouter {
    // install 接收两个参数，一个是Vue构造函数，一个是可选选项对象
    static install(Vue) {
        //- 判断插件是否是已经被安装
        if (VueRouter.install.installed) {
            return
        }
        VueRouter.install.installed = true
        //- 把Vue构造函数记录到全局变量中，vue实例方法中要用到Vue的构造函数，例如：使用功能vue.conponent创建router-link等组件
        _Vue = Vue
        //- 把创建实例时传入的router对象注入到所有vue实例上，$router就是在这里注入的，所有的组件也都是vue的实例
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
                if (this.$options.router) {
                    _Vue.prototype.$router = this.$options.router
                    // 先找到router对象，再调用对象的init方法
                    this.$options.router.init()
                }

            },
        })
    }
    constructor(options) {
        console.log(options, 'options')
        this.options = options
        this.routeMap = {}
        //Vue.observable用于创建响应式对象,可以直接用在渲染函数或者计算属性里面
        this.data = _Vue.observable({
            current: options.mode || options.mode == 'hash' ? window.location.hash.replace("#", "") : '/'
        })
    }

    init() {
        this.createRouteMap()
        this.initComponents(_Vue)
        this.initEvent()
    }
    createRouteMap() {
        //遍历所有的路有规则，把路由规则以键值对的方式存储到routeMap中
        this.options.routes.forEach(route => {
            this.routeMap[route.path] = route.component
        })
    }

    initComponents(Vue) {
        const self = this
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
            // template: '<a :href="to"><slot></slot></a>'
            render(h) {
                /**
                 * 完整版本的vue中有编译器，可以将template转换为render函数
                 * 在运行时版本中没有编译器，我们直接来写render函数
                 * render函数一般会接受一个h函数，来帮我们创建虚拟DOM，然后返回这个h函数
                 */
                // 渲染函数
                /**
                 * 接收三个参数
                 * 选择器：标签
                 * 属性
                 * 标签里的内容
                 */
                return h('a', {
                    attrs: {
                        href: this.to//表示标签的href属性接收this.to的值

                    },
                    on: {
                        click: this.clickHandler
                    }
                },
                    //可能包括很多内容所以用数组展示
                    //使用this.$slots.default获取默认插槽的内容
                    [this.$slots.default])
            },
            methods: {
                clickHandler(e) {
                    console.log(self.options)
                    if (!self.options.mode || self.options.mode == 'hash') {
                        // 如果是hash状态改变地址栏
                        window.location.hash = this.to;
                    } else {
                        //路由的点击事件
                        history.pushState({}, '', this.to)
                        this.$router.data.current = this.to
                    }
                    e.preventDefault();
                }
            },
        })

        //创建router-view
        Vue.component('router-view', {
            render(h) {
                // 获取当前路由地址对应的组件
                const componnet = self.routeMap[self.data.current]
                //h函数用于返回虚拟DOM，h函数可以直接把组件返回成虚拟DOM
                return h(componnet)
            }
        })
    }

    initEvent() {
        window.addEventListener('popstate', () => {
            //因为使用了箭头函数，所以这里的this指向的是initEvent中的箭头函数也就是VueRouter
            if (!this.options.mode || this.options.mode == 'hash') {
                // 将 # 后的路径赋值给currentPath
                this.data.current = window.location.hash.slice(1)
            } else {
                this.data.current = window.location.pathname
            }


        })
    }
}
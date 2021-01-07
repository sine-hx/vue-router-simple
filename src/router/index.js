import Vue from 'vue'
import VueRouter from '../vuerouter'
import Index from '../views/Index.vue'
// 1. 注册路由插件
/**
 * Vue.user是用来注册插件，如果里面是个函数，Vue.use会直接调用这个函数注册组件
 * 如果传入的是个对象的话，他会调用传入对象的install方法来注册插件
 */
Vue.use(VueRouter)

// 路由规则
const routes = [
  {
    path: '/',
    name: 'Index',
    component: Index
  },
  {
    path: '/blog',
    name: 'Blog',
    component: () => import(/* webpackChunkName: "blog" */ '../views/Blog.vue')
  },
  {
    path: '/photo',
    name: 'Photo',
    component: () => import(/* webpackChunkName: "photo" */ '../views/Photo.vue')
  }
]
// 2. 创建 router 对象
const router = new VueRouter({
  mode: 'hash',
  routes
})

export default router

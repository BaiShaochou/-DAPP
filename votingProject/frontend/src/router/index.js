import { createRouter, createWebHashHistory } from 'vue-router'

/**
 * 路由配置
 * @author 陈志琛
 * @description 定义应用的路由结构，包括首页、投票大厅和管理后台
 */
const routes = [
    {
        path: '/',
        name: 'Home',
        // 首页独立存在，不带导航栏
        component: () => import('@/views/HomeView.vue')
    },
    {
        path: '/app',
        name: 'Layout',
        component: () => import('@/views/LayoutView.vue'),
        redirect: '/app/voting', // 默认进入投票大厅
        children: [
            {
                path: 'voting',
                name: 'Voting',
                component: () => import('@/views/VotingView.vue')
            },
            {
                path: 'admin',
                name: 'Admin',
                component: () => import('@/views/AdminView.vue')
            }
        ]
    }
]
const router = createRouter({
    history: createWebHashHistory(),
    routes
})
export default router
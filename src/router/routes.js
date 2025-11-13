const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '/', component: () => import('src/pages/services/time_tracking/TTIndex.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: ['admin', 'expert'],
          permissionsBlock: {
            expert: ['deleteConfig'],
          },
        },
      },
      { path: '/login', component: () => import('src/pages/LoginPage.vue') },
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('src/pages/ErrorPage404.vue')
  }
]

export default routes

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '/', component: () => import('src/pages/services/time_tracking/time_tracking.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: ['admin', 'expert'],
          permissionsBlock: {
            expert: ['deleteConfig'],
          },
        },
       },
      { path: '/login', component: () => import('src/pages/LoginPage.vue') },
      { path: '/error_allow', component: () => import('src/pages/ErrorAllow.vue') },
    ]
  },
  // {
  //   path: '/:catchAll(.*)*',
  //   component: () => import('src/pages/Error-404.vue')
  // }
]

export default routes

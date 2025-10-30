const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '/', component: () => import('src/pages/services/time_tracking/time_tracking.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: ['admin'],
          permissionsBlock: {
            expert: ['deleteConfig'],
            user: ['deleteConfig', 'updateConfig', 'useCoef', 'useCoefWithSelfPrice'],
            user_master: ['deleteConfig', 'updateConfig', 'useCoef'],
          },
        },
       },
      { path: '/login', component: () => import('src/pages/LoginPage.vue') },
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('src/pages/Error-404.vue')
  }
]

export default routes

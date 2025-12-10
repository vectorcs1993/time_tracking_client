const routes = [
  {
    path: '/',
    redirect: '/home',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '/home', component: () => import('src/pages/IndexPage.vue'),
      },
      {
        path: '/tables', component: () => import('src/pages/services/time_tracking/TTTables.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: ['admin', 'user'],
        },
      },
      {
        path: '/table/:id', component: () => import('src/pages/services/time_tracking/TTTableOpen.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: ['admin', 'user'],
        },
      },
      {
        path: '/reports', component: () => import('src/pages/services/time_tracking/TTReports.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: ['admin', 'user'],
        },
      },
      {
        path: '/report/:id', component: () => import('src/pages/services/time_tracking/TTReportOpen.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: ['admin', 'user'],
        },
      },
      {
        path: '/configurations/table/:id', component: () => import('src/pages/services/time_tracking/TTTableSettings.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: ['admin'],
        },
      },
      {
        path: '/configurations/report/:id', component: () => import('src/pages/services/time_tracking/TTReportSettings.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: ['admin'],
        },
      },
      {
        path: '/projects', component: () => import('src/pages/services/time_tracking/TTProjects.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: ['admin', 'user'],
        },
      },
      {
        path: '/activities', component: () => import('src/pages/services/time_tracking/TTActivities.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: ['admin', 'user'],
        },
      },
      {
        path: '/sources', component: () => import('src/pages/services/time_tracking/TTSources.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: ['admin', 'user'],
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

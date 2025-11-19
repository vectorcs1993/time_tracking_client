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
        path: '/tables', component: () => import('src/pages/services/time_tracking/TTTable.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: ['admin', 'user'],
        },
      },
      {
        path: '/tables/:id', component: () => import('src/pages/services/time_tracking/TTTableComponent.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: ['admin'],
        },
      },
      {
        path: '/reports', component: () => import('src/pages/services/time_tracking/TTReport.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: ['admin', 'user'],
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
      {
        path: '/settings/tables', component: () => import('src/pages/services/time_tracking/TTTableSettings.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: ['admin'],
        },
      },
      {
        path: '/settings/reports', component: () => import('src/pages/services/time_tracking/TTReportSettings.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: ['admin'],
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

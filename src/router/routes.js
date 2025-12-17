
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
          allowedRoles: [0, 1],
        },
      },
      {
        path: '/table/:id', component: () => import('src/pages/services/time_tracking/TTTableOpen.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: [0, 1],
        },
      },
      {
        path: '/reports', component: () => import('src/pages/services/time_tracking/TTReports.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: [0, 1],
        },
      },
      {
        path: '/report/:id', component: () => import('src/pages/services/time_tracking/TTReportOpen.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: [0, 1],
        },
      },
      {
        path: '/configurations/table/:id', component: () => import('src/pages/services/time_tracking/TTTableSettings.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: [1],
        },
      },
      {
        path: '/configurations/report/:id', component: () => import('src/pages/services/time_tracking/TTReportSettings.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: [1],
        },
      },
      {
        path: '/projects', component: () => import('src/pages/services/time_tracking/TTProjects.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: [0, 1],
        },
      },
      {
        path: '/activities', component: () => import('src/pages/services/time_tracking/TTActivities.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: [1],
        },
      },
      {
        path: '/sources', component: () => import('src/pages/services/time_tracking/TTSources.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: [1],
        },
      },
      {
        path: '/users', component: () => import('src/pages/services/time_tracking/TTUsers.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: [1],
        },
      },
      {
        path: '/branches', component: () => import('src/pages/services/time_tracking/TTBranches.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: [1],
        },
      },
      {
        path: '/daily_reports', component: () => import('src/pages/services/time_tracking/TTDailyReports.vue'),
        meta: {
          requiresAuth: true,
          allowedRoles: [0, 1],
        },
      },
      { path: '/login', component: () => import('src/pages/LoginPage.vue') },
      {
        path: '/access-denied', component: () => import('src/pages/AccessDenied.vue'),
        meta: {
          title: 'Доступ запрещен',
          requiresAuth: true,
          allowedRoles: [0, 1],
        },
      },
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('src/pages/ErrorPage404.vue')
  }
]

export default routes

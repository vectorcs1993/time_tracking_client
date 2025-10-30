import { defineRouter } from '#q-app/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes.js'
import store from '../store/index.js';
/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })
  Router.beforeEach((to, from, next) => {
    if (to.matched.some((record) => record.meta.requiresAuth)) {
      store.storeVue.dispatch('isAuth').then((resp) => {
        if (to.meta) {
          if (to.meta.allowedRoles) {
            if (to.meta.allowedRoles.includes(resp.user.role)) {
              next();
            } else {
              next({ path: '/error_allow' });
            }
          } else {
            next();
          }
        } else {
          next();
        }
      }).catch(() => {
        store.storeVue.dispatch('logout').then(() => {
          next({ path: '/login', query: { redirect: to.path } });
          if (store.storeVue.state.upd) {
            store.storeVue.state.upd();
          }
        });
      });
    } else {
      next();
    }
  });
  return Router
})

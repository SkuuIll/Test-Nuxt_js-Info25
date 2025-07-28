import { createPersistedState } from 'pinia-plugin-persistedstate'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.$pinia.use(createPersistedState({
    storage: localStorage,
    key: (id) => `__persisted__${id}`,
  }))
})
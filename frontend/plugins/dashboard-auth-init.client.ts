export default defineNuxtPlugin(async () => {
    // Skip dashboard auth initialization for now since we're using simplified auth
    console.log('Dashboard auth plugin loaded (using simplified auth)')
})
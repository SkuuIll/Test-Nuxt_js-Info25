<template>
  <header class="fixed top-0 left-0 right-0 z-50 navbar-blur">
    <nav class="container mx-auto px-4 py-3">
      <div class="flex items-center justify-between">
        <!-- Brand -->
        <NuxtLink
          to="/"
          class="flex items-center space-x-2 text-xl font-bold text-gray-900 dark:text-white"
        >
          <Icon name="newspaper" class="w-8 h-8 text-primary-600" />
          <span>Blog de Noticias</span>
        </NuxtLink>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-6">
          <NuxtLink to="/" class="nav-link" :class="{ active: $route.path === '/' }">
            Inicio
          </NuxtLink>

          <!-- Categories Dropdown -->
          <div ref="categoriesDropdown" class="relative">
            <button class="nav-link flex items-center space-x-1" @click="toggleCategoriesDropdown">
              <span>Categorías</span>
              <Icon name="chevron-down" class="w-4 h-4" />
            </button>

            <Transition name="dropdown">
              <div
                v-if="showCategoriesDropdown"
                class="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2"
              >
                <NuxtLink
                  v-for="category in categories"
                  :key="category.id"
                  :to="`/posts?category=${category.slug}`"
                  class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  @click="showCategoriesDropdown = false"
                >
                  {{ category.name }}
                  <span class="text-xs text-gray-500 ml-2">({{ category.posts_count }})</span>
                </NuxtLink>
              </div>
            </Transition>
          </div>

          <NuxtLink to="/posts" class="nav-link"> Posts </NuxtLink>
          <NuxtLink to="/search" class="nav-link"> Buscar </NuxtLink>
        </div>

        <!-- Search Bar -->
        <div class="hidden md:block flex-1 max-w-md mx-8">
          <SearchBar />
        </div>

        <!-- Right Side Actions -->
        <div class="flex items-center space-x-4">
          <!-- Theme Toggle -->
          <ThemeToggle />

          <!-- Auth Buttons -->
          <div v-if="!isAuthenticated" class="hidden md:flex items-center space-x-2">
            <NuxtLink to="/login" class="btn btn-ghost btn-sm"> Iniciar Sesión </NuxtLink>
            <NuxtLink to="/register" class="btn btn-primary btn-sm"> Registrarse </NuxtLink>
          </div>

          <!-- User Menu -->
          <div v-else ref="userDropdown" class="relative">
            <button
              class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              @click="toggleUserDropdown"
            >
              <div
                class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium"
              >
                {{ user?.username?.charAt(0).toUpperCase() }}
              </div>
              <Icon name="chevron-down" class="w-4 h-4" />
            </button>

            <Transition name="dropdown">
              <div
                v-if="showUserDropdown"
                class="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2"
              >
                <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ user?.username }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ user?.email }}
                  </p>
                </div>

                <NuxtLink to="/profile" class="dropdown-item">
                  <Icon name="user" class="w-4 h-4" />
                  Mi Perfil
                </NuxtLink>

                <NuxtLink v-if="user?.is_staff" to="/dashboard" class="dropdown-item">
                  <Icon name="settings" class="w-4 h-4" />
                  Dashboard
                </NuxtLink>

                <button class="dropdown-item w-full text-left" @click="handleLogout">
                  <Icon name="logout" class="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            </Transition>
          </div>

          <!-- Mobile Menu Button -->
          <button
            class="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            @click="toggleMobileMenu"
          >
            <Icon :name="showMobileMenu ? 'x' : 'menu'" class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Mobile Menu -->
      <Transition name="mobile-menu">
        <div
          v-if="showMobileMenu"
          class="md:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-700"
        >
          <!-- Mobile Search -->
          <div class="py-4">
            <SearchBar />
          </div>

          <!-- Mobile Navigation -->
          <div class="space-y-2">
            <NuxtLink to="/" class="mobile-nav-link" @click="showMobileMenu = false">
              Inicio
            </NuxtLink>

            <div class="space-y-1">
              <button
                class="mobile-nav-link w-full flex items-center justify-between"
                @click="toggleMobileCategoriesDropdown"
              >
                <span>Categorías</span>
                <Icon
                  name="chevron-down"
                  class="w-4 h-4"
                  :class="{ 'rotate-180': showMobileCategoriesDropdown }"
                />
              </button>

              <Transition name="mobile-dropdown">
                <div v-if="showMobileCategoriesDropdown" class="pl-4 space-y-1">
                  <NuxtLink
                    v-for="category in categories"
                    :key="category.id"
                    :to="`/posts?category=${category.slug}`"
                    class="block py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600"
                    @click="showMobileMenu = false"
                  >
                    {{ category.name }} ({{ category.posts_count }})
                  </NuxtLink>
                </div>
              </Transition>
            </div>

            <NuxtLink to="/posts" class="mobile-nav-link" @click="showMobileMenu = false">
              Posts
            </NuxtLink>
            <NuxtLink to="/search" class="mobile-nav-link" @click="showMobileMenu = false">
              Buscar
            </NuxtLink>
          </div>

          <!-- Mobile Auth -->
          <div
            v-if="!isAuthenticated"
            class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2"
          >
            <NuxtLink to="/login" class="btn btn-ghost w-full" @click="showMobileMenu = false">
              Iniciar Sesión
            </NuxtLink>
            <NuxtLink to="/register" class="btn btn-primary w-full" @click="showMobileMenu = false">
              Registrarse
            </NuxtLink>
          </div>
        </div>
      </Transition>
    </nav>
  </header>
</template>

<script setup lang="ts">
const { user, isAuthenticated, logout } = useAuth()
const blogStore = useBlogStore()

// Reactive state
const showMobileMenu = ref(false)
const showCategoriesDropdown = ref(false)
const showUserDropdown = ref(false)
const showMobileCategoriesDropdown = ref(false)

// Template refs
const categoriesDropdown = ref<HTMLElement>()
const userDropdown = ref<HTMLElement>()

// Computed
const categories = computed(() => blogStore.categories)

// Load categories on mount
onMounted(async () => {
  try {
    await blogStore.fetchCategories()
  } catch (error) {
    console.error('Error loading categories in header:', error)
  }
})

// Methods
const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
}

const toggleCategoriesDropdown = () => {
  showCategoriesDropdown.value = !showCategoriesDropdown.value
}

const toggleUserDropdown = () => {
  showUserDropdown.value = !showUserDropdown.value
}

const toggleMobileCategoriesDropdown = () => {
  showMobileCategoriesDropdown.value = !showMobileCategoriesDropdown.value
}

const handleLogout = async () => {
  await logout()
  showUserDropdown.value = false
}

// Close dropdowns when clicking outside
onClickOutside(categoriesDropdown, () => {
  showCategoriesDropdown.value = false
})

onClickOutside(userDropdown, () => {
  showUserDropdown.value = false
})

// Close mobile menu on route change
watch(
  () => useRoute().path,
  () => {
    showMobileMenu.value = false
  }
)
</script>

<style scoped>
.nav-link {
  @apply text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors duration-200;
}

.nav-link.active {
  @apply text-primary-600 dark:text-primary-400;
}

.mobile-nav-link {
  @apply block py-3 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors duration-200;
}

.dropdown-item {
  @apply flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200;
}

/* Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.3s ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.mobile-dropdown-enter-active,
.mobile-dropdown-leave-active {
  transition: all 0.2s ease;
}

.mobile-dropdown-enter-from,
.mobile-dropdown-leave-to {
  opacity: 0;
  max-height: 0;
}

.mobile-dropdown-enter-to,
.mobile-dropdown-leave-from {
  opacity: 1;
  max-height: 200px;
}
</style>
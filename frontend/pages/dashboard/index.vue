<template>
  <div>
    <!-- Welcome section -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">
        ¡Bienvenido, {{ user?.username }}!
      </h1>
      <p class="mt-1 text-sm text-gray-600">
        Aquí tienes un resumen de la actividad de tu blog
      </p>
    </div>

    <!-- Stats cards -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      <DashboardStatCard
        title="Posts Totales"
        :value="summary?.totals.posts || 0"
        :change="summary?.week.posts || 0"
        change-label="esta semana"
        icon="DocumentTextIcon"
        color="blue"
        link="/dashboard/posts"
      />
      <DashboardStatCard
        title="Usuarios"
        :value="summary?.totals.users || 0"
        :change="summary?.week.users || 0"
        change-label="esta semana"
        icon="UsersIcon"
        color="green"
        link="/dashboard/users"
      />
      <DashboardStatCard
        title="Comentarios"
        :value="summary?.totals.comments || 0"
        :change="summary?.week.comments || 0"
        change-label="esta semana"
        icon="ChatBubbleLeftRightIcon"
        color="purple"
        link="/dashboard/comments"
      />
      <DashboardStatCard
        title="Pendientes"
        :value="summary?.pending.pending_comments || 0"
        :change="0"
        icon="ExclamationTriangleIcon"
        color="yellow"
        :link="summary?.pending.pending_comments ? '/dashboard/comments?filter=pending' : undefined"
      />
    </div>

    <!-- Charts and activity -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- Recent activity -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
            Actividad Reciente
          </h3>
          <DashboardActivityFeed :activities="stats?.recent_activity || []" />
        </div>
      </div>

      <!-- Popular posts -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
            Posts Populares
          </h3>
          <DashboardPopularPosts :posts="stats?.popular_posts || []" />
        </div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
          Acciones Rápidas
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardQuickAction
            v-if="hasPermission('can_manage_posts')"
            title="Crear Post"
            description="Escribir un nuevo artículo"
            icon="PlusIcon"
            to="/dashboard/posts/create"
            color="blue"
          />
          <DashboardQuickAction
            v-if="hasPermission('can_manage_comments') && pendingCommentsCount > 0"
            title="Moderar Comentarios"
            :description="`${pendingCommentsCount} pendientes`"
            icon="ChatBubbleLeftRightIcon"
            to="/dashboard/comments?filter=pending"
            color="yellow"
          />
          <DashboardQuickAction
            v-if="hasPermission('can_manage_users')"
            title="Gestionar Usuarios"
            description="Administrar usuarios"
            icon="UsersIcon"
            to="/dashboard/users"
            color="green"
          />
          <DashboardQuickAction
            v-if="hasPermission('can_view_stats')"
            title="Ver Estadísticas"
            description="Análisis detallado"
            icon="ChartBarIcon"
            to="/dashboard/stats"
            color="purple"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Layout
definePageMeta({
  layout: 'dashboard'
})

// Composables
const { user, hasPermission } = useDashboardAuth()
const { stats, summary, pendingCommentsCount, fetchStats, fetchSummary, startAutoRefresh } = useDashboardStats()

// Fetch data on mount
onMounted(async () => {
  await Promise.all([
    fetchStats(),
    fetchSummary()
  ])
  
  // Start auto-refresh for summary data
  startAutoRefresh()
})

// SEO
useHead({
  title: 'Dashboard - Blog Admin'
})
</script>
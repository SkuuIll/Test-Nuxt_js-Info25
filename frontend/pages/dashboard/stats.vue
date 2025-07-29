<template>
  <div>
    <!-- Page header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">
        Estadísticas Detalladas
      </h1>
      <p class="mt-1 text-sm text-gray-600">
        Análisis completo del rendimiento de tu blog
      </p>
    </div>

    <!-- Overview stats -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      <DashboardStatCard
        title="Posts Publicados"
        :value="contentStats?.posts.published || 0"
        icon="DocumentTextIcon"
        color="blue"
      />
      <DashboardStatCard
        title="Posts Destacados"
        :value="contentStats?.posts.featured || 0"
        icon="EyeIcon"
        color="yellow"
      />
      <DashboardStatCard
        title="Comentarios Aprobados"
        :value="contentStats?.comments.approved || 0"
        icon="ChatBubbleLeftRightIcon"
        color="green"
      />
      <DashboardStatCard
        title="Usuarios Activos"
        :value="userStats?.active_users || 0"
        icon="UsersIcon"
        color="purple"
      />
    </div>

    <!-- Charts section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- Posts by month chart -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
            Posts por Mes
          </h3>
          <div class="h-64">
            <DashboardChart
              v-if="monthlyStats"
              type="line"
              :data="postsChartData"
              :options="chartOptions"
            />
            <div v-else class="flex items-center justify-center h-full">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Comments by month chart -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
            Comentarios por Mes
          </h3>
          <div class="h-64">
            <DashboardChart
              v-if="monthlyStats"
              type="bar"
              :data="commentsChartData"
              :options="chartOptions"
            />
            <div v-else class="flex items-center justify-center h-full">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content breakdown -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- Posts by status -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
            Posts por Estado
          </h3>
          <div class="h-64">
            <DashboardChart
              v-if="contentStats"
              type="doughnut"
              :data="postsStatusChartData"
              :options="doughnutOptions"
            />
            <div v-else class="flex items-center justify-center h-full">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Top categories -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
            Categorías Principales
          </h3>
          <div v-if="contentStats?.categories" class="space-y-4">
            <div
              v-for="category in contentStats.categories.slice(0, 5)"
              :key="category.id"
              class="flex items-center justify-between"
            >
              <div>
                <p class="text-sm font-medium text-gray-900">
                  {{ category.name }}
                </p>
                <p class="text-xs text-gray-500">
                  {{ category.description || 'Sin descripción' }}
                </p>
              </div>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {{ category.posts_count }} posts
              </span>
            </div>
          </div>
          <div v-else class="flex items-center justify-center h-32">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Top performers -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Top authors -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
            Autores Principales
          </h3>
          <div v-if="userStats?.top_authors" class="space-y-4">
            <div
              v-for="(author, index) in userStats.top_authors.slice(0, 5)"
              :key="author.id"
              class="flex items-center space-x-4"
            >
              <div class="flex-shrink-0">
                <span
                  :class="[
                    'inline-flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium',
                    {
                      'bg-yellow-100 text-yellow-800': index === 0,
                      'bg-gray-100 text-gray-800': index === 1,
                      'bg-orange-100 text-orange-800': index === 2,
                      'bg-blue-100 text-blue-800': index > 2
                    }
                  ]"
                >
                  {{ index + 1 }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900">
                  {{ author.username }}
                </p>
                <p class="text-xs text-gray-500">
                  {{ author.email }}
                </p>
              </div>
              <div class="text-sm text-gray-500">
                {{ author.posts_count }} posts
              </div>
            </div>
          </div>
          <div v-else class="flex items-center justify-center h-32">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>

      <!-- Most commented posts -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
            Posts Más Comentados
          </h3>
          <div v-if="contentStats?.most_commented_posts" class="space-y-4">
            <div
              v-for="(post, index) in contentStats.most_commented_posts.slice(0, 5)"
              :key="post.id"
              class="flex items-center space-x-4"
            >
              <div class="flex-shrink-0">
                <span
                  :class="[
                    'inline-flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium',
                    {
                      'bg-yellow-100 text-yellow-800': index === 0,
                      'bg-gray-100 text-gray-800': index === 1,
                      'bg-orange-100 text-orange-800': index === 2,
                      'bg-blue-100 text-blue-800': index > 2
                    }
                  ]"
                >
                  {{ index + 1 }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {{ post.title }}
                </p>
                <p class="text-xs text-gray-500">
                  por {{ post.author }} • {{ post.published_date }}
                </p>
              </div>
              <div class="text-sm text-gray-500">
                {{ post.comments_count }} comentarios
              </div>
            </div>
          </div>
          <div v-else class="flex items-center justify-center h-32">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
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
const { fetchUserStats, fetchContentStats } = useDashboardStats()

// State
const userStats = ref(null)
const contentStats = ref(null)
const monthlyStats = ref(null)
const loading = ref(false)

// Chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  }
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const
    }
  }
}

// Computed chart data
const postsChartData = computed(() => {
  if (!monthlyStats.value?.posts_by_month) return { labels: [], datasets: [] }
  
  return {
    labels: monthlyStats.value.posts_by_month.map((item: any) => item.month),
    datasets: [{
      label: 'Posts',
      data: monthlyStats.value.posts_by_month.map((item: any) => item.count),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true
    }]
  }
})

const commentsChartData = computed(() => {
  if (!monthlyStats.value?.comments_by_month) return { labels: [], datasets: [] }
  
  return {
    labels: monthlyStats.value.comments_by_month.map((item: any) => item.month),
    datasets: [{
      label: 'Comentarios',
      data: monthlyStats.value.comments_by_month.map((item: any) => item.count),
      backgroundColor: 'rgba(16, 185, 129, 0.8)',
      borderColor: 'rgb(16, 185, 129)',
      borderWidth: 1
    }]
  }
})

const postsStatusChartData = computed(() => {
  if (!contentStats.value?.posts) return { labels: [], datasets: [] }
  
  const posts = contentStats.value.posts
  return {
    labels: ['Publicados', 'Borradores', 'Archivados'],
    datasets: [{
      data: [posts.published, posts.draft, posts.archived],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(156, 163, 175, 0.8)'
      ],
      borderColor: [
        'rgb(34, 197, 94)',
        'rgb(251, 191, 36)',
        'rgb(156, 163, 175)'
      ],
      borderWidth: 1
    }]
  }
})

// Fetch data on mount
onMounted(async () => {
  loading.value = true
  
  try {
    const [userStatsData, contentStatsData] = await Promise.all([
      fetchUserStats(),
      fetchContentStats()
    ])
    
    userStats.value = userStatsData
    contentStats.value = contentStatsData
    
    // Mock monthly stats for now
    monthlyStats.value = {
      posts_by_month: [
        { month: 'Ene', count: 5 },
        { month: 'Feb', count: 8 },
        { month: 'Mar', count: 12 },
        { month: 'Abr', count: 7 },
        { month: 'May', count: 15 },
        { month: 'Jun', count: 10 }
      ],
      comments_by_month: [
        { month: 'Ene', count: 15 },
        { month: 'Feb', count: 23 },
        { month: 'Mar', count: 18 },
        { month: 'Abr', count: 32 },
        { month: 'May', count: 28 },
        { month: 'Jun', count: 25 }
      ]
    }
  } catch (error) {
    console.error('Error loading stats:', error)
  } finally {
    loading.value = false
  }
})

// SEO
useHead({
  title: 'Estadísticas - Dashboard'
})
</script>
<template>
  <div v-if="canAccess" class="admin-section">
    <div class="border-t border-gray-200 dark:border-gray-700 my-2"></div>
    
    <div class="px-3 py-2">
      <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Administración
      </p>
    </div>

    <AdminLink to="/admin" icon="home">
      Panel Admin
    </AdminLink>

    <AdminLink to="/admin/posts/create" icon="plus" variant="success">
      <span class="flex items-center space-x-2">
        <span>Crear Post</span>
        <span class="text-xs bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded-full">Nuevo</span>
      </span>
    </AdminLink>

    <AdminLink to="/admin/posts" icon="document-text">
      Gestionar Posts
    </AdminLink>

    <AdminLink to="/admin/comments" icon="chat-bubble-left-right">
      Moderar Comentarios
    </AdminLink>

    <AdminLink v-if="isSuperuser" to="/admin/users" icon="users">
      Gestionar Usuarios
    </AdminLink>
  </div>
</template>

<script setup lang="ts">
const { user } = useAuth()

const canAccess = computed(() => {
  return user.value?.is_staff || user.value?.is_superuser
})

const isSuperuser = computed(() => {
  return user.value?.is_superuser
})
</script>
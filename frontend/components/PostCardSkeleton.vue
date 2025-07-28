<template>
  <div class="card animate-pulse">
    <!-- Image Skeleton -->
    <div class="skeleton h-48 rounded-t-lg" />

    <!-- Content Skeleton -->
    <div class="p-6">
      <!-- Title Skeleton -->
      <div class="space-y-2 mb-3">
        <div class="skeleton-text h-5" />
        <div class="skeleton-text h-5 w-3/4" />
      </div>

      <!-- Excerpt Skeleton -->
      <div class="space-y-2 mb-4">
        <div class="skeleton-text h-4" />
        <div class="skeleton-text h-4" />
        <div class="skeleton-text h-4 w-2/3" />
      </div>

      <!-- Meta Skeleton -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <div class="skeleton-avatar w-6 h-6" />
            <div class="skeleton-text h-4 w-16" />
          </div>
          <div class="skeleton-text h-4 w-20" />
        </div>
        <div class="skeleton-text h-4 w-8" />
      </div>

      <!-- Tags Skeleton -->
      <div class="mt-4 flex space-x-2">
        <div class="skeleton h-6 w-16 rounded" />
        <div class="skeleton h-6 w-20 rounded" />
        <div class="skeleton h-6 w-12 rounded" />
      </div>
    </div>
  </div>
</template>
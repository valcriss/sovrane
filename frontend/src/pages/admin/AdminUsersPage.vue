<script setup lang="ts">
import NavigationBreadcrumb from "@/components/navigation/NavigationBreadcrumb.vue";
import AppDataTable from "@/components/ui/datatable/AppDataTable.vue";
</script>

<template>
  <div class="p-4">
    <NavigationBreadcrumb path="/admin/users" />
    <div class="mt-2">
      <AppDataTable />
    </div>
  </div>
</template>

<style scoped>

</style>

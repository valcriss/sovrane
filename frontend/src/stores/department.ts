import { defineStore } from 'pinia';
import { ref } from 'vue';
import DepartmentsService, { type Department, type ListDepartmentsParams } from '@/services/api/departments.service';
import type {FilterOption} from "naive-ui/es/data-table/src/interface";

export const useDepartmentStore = defineStore('department', () => {
  const departments = ref<Department[]>([]);
  const currentDepartment = ref<Department | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchDepartments(params: ListDepartmentsParams = {}) {
    loading.value = true;
    error.value = null;
    try {
      const response = await DepartmentsService.list(params);
      departments.value = response.items;
      return response;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchDepartment(id: string) {
    loading.value = true;
    error.value = null;
    try {
      const department = await DepartmentsService.get(id);
      currentDepartment.value = department;
      return department;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createDepartment(data: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) {
    loading.value = true;
    error.value = null;
    try {
      const department = await DepartmentsService.create(data);
      departments.value.push(department);
      return department;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateDepartment(id: string, data: Partial<Omit<Department, 'id' | 'createdAt' | 'updatedAt'>>) {
    loading.value = true;
    error.value = null;
    try {
      const updatedDepartment = await DepartmentsService.update(id, data);
      const index = departments.value.findIndex(department => department.id === id);
      if (index !== -1) {
        departments.value[index] = updatedDepartment;
      }
      if (currentDepartment.value?.id === id) {
        currentDepartment.value = updatedDepartment;
      }
      return updatedDepartment;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteDepartment(id: string) {
    loading.value = true;
    error.value = null;
    try {
      await DepartmentsService.remove(id);
      departments.value = departments.value.filter(department => department.id !== id);
      if (currentDepartment.value?.id === id) {
        currentDepartment.value = null;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred';
      throw err;
    } finally {
      loading.value = false;
    }
  }


async function getFilterOptions(): Promise<FilterOption[]> {
  if (!departments.value || departments.value.length === 0) {
    await fetchDepartments();
  }
  
  const filterOptions: FilterOption[] = [];
  
  if (!departments.value || departments.value.length === 0) {
    return filterOptions;
  }
  
  for (let i = 0; i < departments.value.length; i++) {
    const department = departments.value[i];
    filterOptions.push({
      label: department.label,
      value: department.id
    });
  }
  
  return filterOptions;
}

  function clearCurrentDepartment() {
    currentDepartment.value = null;
  }

  function clearDepartments() {
    departments.value = [];
    currentDepartment.value = null;
    error.value = null;
  }

  return {
    departments,
    currentDepartment,
    loading,
    error,
    fetchDepartments,
    fetchDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    clearCurrentDepartment,
    clearDepartments,
    getFilterOptions
  };
});

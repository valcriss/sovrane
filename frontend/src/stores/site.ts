import {defineStore} from 'pinia';
import {ref} from 'vue';
import SitesService, {type Site, type ListSitesParams} from '@/services/api/sites.service';
import type {FilterOption} from "naive-ui/es/data-table/src/interface";

export const useSiteStore = defineStore('site', () => {
  const sites = ref<Site[]>([]);
  const currentSite = ref<Site | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchSites(params: ListSitesParams = {}) {
    loading.value = true;
    error.value = null;
    try {
      const response = await SitesService.list(params);
      sites.value = response.items;
      return response;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchSite(id: string) {
    loading.value = true;
    error.value = null;
    try {
      const site = await SitesService.get(id);
      currentSite.value = site;
      return site;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createSite(data: Omit<Site, 'id' | 'createdAt' | 'updatedAt'>) {
    loading.value = true;
    error.value = null;
    try {
      const site = await SitesService.create(data);
      sites.value.push(site);
      return site;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateSite(id: string, data: Partial<Omit<Site, 'id' | 'createdAt' | 'updatedAt'>>) {
    loading.value = true;
    error.value = null;
    try {
      const updatedSite = await SitesService.update(id, data);
      const index = sites.value.findIndex(site => site.id === id);
      if (index !== -1) {
        sites.value[index] = updatedSite;
      }
      if (currentSite.value?.id === id) {
        currentSite.value = updatedSite;
      }
      return updatedSite;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteSite(id: string) {
    loading.value = true;
    error.value = null;
    try {
      await SitesService.remove(id);
      sites.value = sites.value.filter(site => site.id !== id);
      if (currentSite.value?.id === id) {
        currentSite.value = null;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function getFilterOptions(): Promise<FilterOption[]> {
    if (!sites.value)
      await fetchSites()
    const filterOptions: FilterOption[] = []
    if (!sites.value || sites.value.length === 0) {
      return filterOptions;
    }
    for (let i = 0; i < sites.value.length; i++) {
      const site = sites.value[i];
      filterOptions.push({
        label: site.label,
        value: site.id
      })
    }
    return filterOptions;
  }

  function clearCurrentSite() {
    currentSite.value = null;
  }

  function clearSites() {
    sites.value = [];
    currentSite.value = null;
    error.value = null;
  }

  return {
    sites,
    currentSite,
    loading,
    error,
    fetchSites,
    fetchSite,
    createSite,
    updateSite,
    deleteSite,
    clearCurrentSite,
    clearSites,
    getFilterOptions
  };
});

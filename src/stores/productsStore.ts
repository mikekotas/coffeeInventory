import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Product, Recipe, ProductForm, RecipeForm } from '@/types'

export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const recipes = ref<Recipe[]>([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('category')
        .order('name')
      if (error) throw error
      products.value = data ?? []
    } finally {
      loading.value = false
    }
  }

  async function fetchRecipesForProduct(productId: string): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*, inventory:inventory(*)')
      .eq('product_id', productId)
    if (error) throw error
    return (data ?? []) as Recipe[]
  }

  async function fetchAllRecipes() {
    const { data, error } = await supabase
      .from('recipes')
      .select('*, inventory:inventory(*), product:products(*)')
    if (error) throw error
    recipes.value = (data ?? []) as Recipe[]
  }

  async function create(form: ProductForm): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(form)
      .select()
      .single()
    if (error) throw error
    products.value.push(data)
    return data
  }

  async function update(id: string, form: Partial<ProductForm>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(form)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    const idx = products.value.findIndex(p => p.id === id)
    if (idx !== -1) products.value[idx] = data
    return data
  }

  async function remove(id: string) {
    const { error } = await supabase.from('products').update({ is_active: false }).eq('id', id)
    if (error) throw error
    const idx = products.value.findIndex(p => p.id === id)
    if (idx !== -1) products.value[idx].is_active = false
  }

  async function addRecipe(productId: string, form: RecipeForm): Promise<Recipe> {
    const { data, error } = await supabase
      .from('recipes')
      .insert({ product_id: productId, ...form })
      .select('*, inventory:inventory(*)')
      .single()
    if (error) throw error
    return data as Recipe
  }

  async function updateRecipe(recipeId: string, quantityRequired: number): Promise<Recipe> {
    const { data, error } = await supabase
      .from('recipes')
      .update({ quantity_required: quantityRequired })
      .eq('id', recipeId)
      .select('*, inventory:inventory(*)')
      .single()
    if (error) throw error
    return data as Recipe
  }

  async function removeRecipe(recipeId: string) {
    const { error } = await supabase.from('recipes').delete().eq('id', recipeId)
    if (error) throw error
  }

  return {
    products,
    recipes,
    loading,
    fetchAll,
    fetchRecipesForProduct,
    fetchAllRecipes,
    create,
    update,
    remove,
    addRecipe,
    updateRecipe,
    removeRecipe,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProductsStore, import.meta.hot))
}

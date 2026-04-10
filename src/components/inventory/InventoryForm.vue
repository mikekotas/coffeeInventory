<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useI18n } from 'vue-i18n'
import type { InventoryItem, InventoryItemForm } from '@/types'
import { INVENTORY_UNITS, INVENTORY_CATEGORIES } from '@/lib/constants'

const { t } = useI18n()

interface Props {
  item?: InventoryItem | null
  loading?: boolean
}
const props = withDefaults(defineProps<Props>(), { item: null, loading: false })
const emit = defineEmits<{ submit: [form: InventoryItemForm]; cancel: [] }>()

const unitOptions = computed(() => Object.keys(INVENTORY_UNITS).map((value) => ({ value, label: t(`units.inventory.${value}`) })))
const categoryOptions = computed(() => Object.keys(INVENTORY_CATEGORIES).map((value) => ({ value, label: t(`categories.inventory.${value}`) })))

const form = reactive<InventoryItemForm>({
  name: '',
  name_el: '',
  unit: 'units',
  stock_qty: 0,
  warning_threshold: 10,
  critical_threshold: 5,
  category: 'real_stuff',
  is_active: true,
})

watch(() => props.item, (item) => {
  if (item) {
    form.name = item.name
    form.name_el = item.name_el ?? ''
    form.unit = item.unit
    form.stock_qty = item.stock_qty
    form.warning_threshold = item.warning_threshold
    form.critical_threshold = item.critical_threshold
    form.category = item.category
    form.is_active = item.is_active
  }
}, { immediate: true })

function onSubmit() {
  emit('submit', { ...form })
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <AppInput v-model="form.name" :label="t('inventory.itemName')" :placeholder="t('inventory.itemNamePlaceholder')" required />
    <AppInput :model-value="form.name_el ?? ''" @update:model-value="form.name_el = ($event as string)" :label="t('inventory.greekName')" :placeholder="t('inventory.greekNamePlaceholder')" />

    <div class="grid grid-cols-2 gap-3">
      <AppSelect
        v-model="form.unit"
        :options="unitOptions"
        :label="t('inventory.unit')"
        required
      />
      <AppSelect
        v-model="form.category"
        :options="categoryOptions"
        :label="t('inventory.category')"
        required
      />
    </div>

    <AppInput
      v-model="form.stock_qty"
      type="number"
      :label="t('inventory.currentStock')"
      placeholder="0"
      required
    />

    <div class="grid grid-cols-2 gap-3">
      <AppInput
        v-model="form.warning_threshold"
        type="number"
        :label="t('inventory.warningThreshold')"
        :suffix="t(`units.inventory.${form.unit}`)"
        required
      />
      <AppInput
        v-model="form.critical_threshold"
        type="number"
        :label="t('inventory.criticalThreshold')"
        :suffix="t(`units.inventory.${form.unit}`)"
        required
      />
    </div>

    <div class="flex items-center gap-2">
      <input
        id="is_active"
        v-model="form.is_active"
        type="checkbox"
        class="w-4 h-4 rounded bg-slate-700 border-slate-600 text-brand-600 focus:ring-brand-500"
      />
      <label for="is_active" class="text-sm text-slate-300">{{ t('inventory.activeVisibility') }}</label>
    </div>

    <div class="flex gap-2 pt-2">
      <AppButton variant="ghost" type="button" full-width @click="emit('cancel')">{{ t('common.cancel') }}</AppButton>
      <AppButton type="submit" :loading="loading" full-width>
        {{ item ? t('inventory.updateItem') : t('inventory.addItem') }}
      </AppButton>
    </div>
  </form>
</template>

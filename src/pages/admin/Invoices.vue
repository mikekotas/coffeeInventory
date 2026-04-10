<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useInvoicesStore } from '@/stores/invoicesStore'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useFormatters } from '@/composables/useFormatters'
import { useI18n } from 'vue-i18n'
import type { InvoiceForm } from '@/types'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppStatCard from '@/components/ui/AppStatCard.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import InvoiceFormComp from '@/components/invoices/InvoiceForm.vue'
import { Plus, Trash2, ExternalLink, Receipt, Euro } from 'lucide-vue-next'

const store = useInvoicesStore()
const toast = useToast()
const { confirm } = useConfirm()
const { formatCurrency, formatDateShort } = useFormatters()
const { t } = useI18n()

const showModal = ref(false)
const saving = ref(false)

onMounted(() => store.fetchAll())

async function handleSubmit(form: InvoiceForm, file: File | null) {
  saving.value = true
  try {
    await store.create(form, file ?? undefined)
    toast.success(t('invoices.invoiceSaved'))
    showModal.value = false
  } catch (err: unknown) {
    toast.error(t('invoices.saveFailed'), err instanceof Error ? err.message : '')
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: string) {
  const ok = await confirm({
    title: t('invoices.deleteInvoice'),
    message: t('invoices.deleteInvoiceMsg'),
    confirmLabel: t('invoices.deleteBtn'),
    danger: true,
  })
  if (!ok) return
  await store.remove(id)
  toast.success(t('invoices.invoiceDeleted'))
}
</script>

<template>
  <div class="space-y-4">
    <!-- Stats -->
    <div class="grid grid-cols-2 gap-3">
      <AppStatCard :title="t('invoices.totalSpend')" :value="formatCurrency(store.totalSpend)" :subtitle="t('invoices.allTime')" icon-bg="bg-brand-500/20">
        <template #icon><Euro class="w-5 h-5 text-brand-400" /></template>
      </AppStatCard>
      <AppStatCard :title="t('invoices.thisMonth')" :value="formatCurrency(store.monthlySpend)" icon-bg="bg-blue-500/20">
        <template #icon><Receipt class="w-5 h-5 text-blue-400" /></template>
      </AppStatCard>
    </div>

    <div class="flex justify-end">
      <AppButton @click="showModal = true"><Plus class="w-4 h-4" /> {{ t('invoices.addInvoice') }}</AppButton>
    </div>

    <AppCard padding="none">
      <AppSpinner v-if="store.loading" center />
      <AppEmptyState
        v-else-if="store.invoices.length === 0"
        :title="t('invoices.noInvoices')"
        :description="t('invoices.noInvoicesDesc')"
      >
        <template #icon><Receipt class="w-8 h-8 text-slate-500" /></template>
        <template #action>
          <AppButton size="sm" @click="showModal = true"><Plus class="w-4 h-4" /> {{ t('invoices.addInvoice') }}</AppButton>
        </template>
      </AppEmptyState>

      <div v-else class="divide-y divide-slate-700/50">
        <div
          v-for="inv in store.invoices"
          :key="inv.id"
          class="flex items-center gap-3 px-4 py-3"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ inv.description }}</p>
            <div class="flex items-center gap-2 mt-0.5">
              <p class="text-xs text-slate-500">{{ formatDateShort(inv.invoice_date) }}</p>
              <span v-if="inv.supplier" class="text-xs text-slate-600">· {{ inv.supplier }}</span>
            </div>
          </div>
          <p class="text-sm font-semibold text-white shrink-0">{{ formatCurrency(inv.amount) }}</p>
          <div class="flex gap-1 shrink-0">
            <a
              v-if="inv.file_url"
              :href="inv.file_url"
              target="_blank"
              class="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-slate-700 transition-colors"
            >
              <ExternalLink class="w-4 h-4" />
            </a>
            <button
              class="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
              @click="handleDelete(inv.id)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </AppCard>

    <AppModal :open="showModal" :title="t('invoices.addInvoice')" @close="showModal = false">
      <InvoiceFormComp :loading="saving" @submit="handleSubmit" @cancel="showModal = false" />
    </AppModal>
  </div>
</template>

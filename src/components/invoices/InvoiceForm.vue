<script setup lang="ts">
import { reactive, ref } from 'vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useI18n } from 'vue-i18n'
import type { InvoiceForm as IInvoiceForm } from '@/types'
import { format } from 'date-fns'

const { t } = useI18n()

interface Props {
  loading?: boolean
}
withDefaults(defineProps<Props>(), { loading: false })
const emit = defineEmits<{ submit: [form: IInvoiceForm, file: File | null]; cancel: [] }>()

const form = reactive<IInvoiceForm>({
  amount: 0,
  description: '',
  supplier: '',
  invoice_date: format(new Date(), 'yyyy-MM-dd'),
})

const fileRef = ref<File | null>(null)

function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  fileRef.value = input.files?.[0] ?? null
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="emit('submit', { ...form }, fileRef)">
    <AppInput
      v-model="form.description"
      :label="t('invoices.description')"
      :placeholder="t('invoices.descriptionPlaceholder')"
      required
    />

    <div class="grid grid-cols-2 gap-3">
      <AppInput
        v-model="form.amount"
        type="number"
        :label="t('invoices.amount')"
        prefix="€"
        placeholder="0.00"
        required
      />
      <AppInput
        v-model="form.invoice_date"
        type="date"
        :label="t('invoices.invoiceDate')"
        required
      />
    </div>

    <AppInput
      v-model="form.supplier"
      :label="t('invoices.supplier')"
      :placeholder="t('invoices.supplierPlaceholder')"
    />

    <div>
      <label class="text-sm font-medium text-slate-300 block mb-1">{{ t('invoices.attachment') }}</label>
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        class="block w-full text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-700 file:text-slate-300 hover:file:bg-slate-600 file:cursor-pointer"
        @change="onFile"
      />
    </div>

    <div class="flex gap-2 pt-2">
      <AppButton variant="ghost" type="button" full-width @click="emit('cancel')">{{ t('common.cancel') }}</AppButton>
      <AppButton type="submit" :loading="loading" full-width>{{ t('invoices.saveInvoice') }}</AppButton>
    </div>
  </form>
</template>

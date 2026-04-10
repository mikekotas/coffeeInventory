<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePosStore } from '@/stores/posStore'
import { useToast } from '@/composables/useToast'
import { useFormatters } from '@/composables/useFormatters'
import { useI18n } from 'vue-i18n'
import { useProductName } from '@/composables/useProductName'
import AppDrawer from '@/components/ui/AppDrawer.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppInput from '@/components/ui/AppInput.vue'
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-vue-next'

const { t } = useI18n()
const { getName } = useProductName()

interface Props {
  open: boolean
  shiftIdOverride?: string | null
}
const props = defineProps<Props>()
const emit = defineEmits<{ close: []; sold: [saleId: string] }>()

const posStore = usePosStore()
const toast = useToast()
const { formatCurrency } = useFormatters()
const confirming = ref(false)

const canConfirm = computed(() => {
  if (posStore.isEmpty) return false
  if (posStore.saleType === 'table' && !posStore.tableIdentifier.trim()) return false
  if (posStore.paymentMethod === 'credit' && !posStore.tableIdentifier.trim()) return false
  return true
})

async function handleConfirm() {
  if (!canConfirm.value) return
  confirming.value = true
  try {
    const saleId = await posStore.confirmSale(props.shiftIdOverride)
    toast.success(t('pos.saleRecorded'), `Total: ${formatCurrency(posStore.cartTotal)}`)
    emit('sold', saleId)
    emit('close')
  } catch (err: unknown) {
    toast.error(t('pos.saleFailed'), err instanceof Error ? err.message : t('pos.saleTryAgain'))
  } finally {
    confirming.value = false
  }
}
</script>

<template>
  <AppDrawer :open="open" :title="t('pos.currentOrder')" side="right" @close="emit('close')">
    <!-- Cart items -->
    <div class="p-4 space-y-2">
      <AppEmptyState v-if="posStore.isEmpty" :title="t('pos.cartEmpty')" :description="t('pos.cartEmptyDesc')">
        <template #icon>
          <ShoppingCart class="w-8 h-8 text-slate-500" />
        </template>
      </AppEmptyState>

      <div
        v-for="item in posStore.cart"
        :key="item.product.id"
        class="flex items-center gap-3 bg-slate-700/40 rounded-xl p-3"
      >
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-white truncate">{{ getName(item.product) }}</p>
          <p class="text-xs text-slate-400">{{ formatCurrency(item.product.base_price) }} {{ t('pos.each') }}</p>
        </div>

        <!-- Qty controls -->
        <div class="flex items-center gap-1.5">
          <button
            class="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-600 hover:bg-slate-500 text-white transition-colors"
            @click="posStore.updateQty(item.product.id, item.qty - 1)"
          >
            <Minus class="w-3.5 h-3.5" />
          </button>
          <span class="w-6 text-center text-sm font-bold text-white">{{ item.qty }}</span>
          <button
            class="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-600 hover:bg-slate-500 text-white transition-colors"
            @click="posStore.updateQty(item.product.id, item.qty + 1)"
          >
            <Plus class="w-3.5 h-3.5" />
          </button>
        </div>

        <div class="text-right min-w-[60px]">
          <p class="text-sm font-semibold text-white">{{ formatCurrency(item.product.base_price * item.qty) }}</p>
        </div>

        <button
          class="text-slate-500 hover:text-red-400 transition-colors"
          @click="posStore.removeFromCart(item.product.id)"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <template #footer>
      <div class="p-4 space-y-3">
        <!-- Total -->
        <div class="flex justify-between items-center py-3 border-t border-slate-700">
          <span class="text-sm text-slate-400">{{ t('pos.total') }}</span>
          <span class="text-xl font-bold text-white">{{ formatCurrency(posStore.cartTotal) }}</span>
        </div>

        <!-- Sale Type Selection -->
        <div class="space-y-3 pb-2">
          <div class="flex p-1 bg-slate-900 rounded-lg">
            <button
              class="flex-1 py-1.5 text-sm font-medium rounded-md transition-colors"
              :class="posStore.saleType === 'takeaway' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'"
              @click="posStore.saleType = 'takeaway'"
            >
              {{ t('pos.takeaway') }}
            </button>
            <button
              class="flex-1 py-1.5 text-sm font-medium rounded-md transition-colors"
              :class="posStore.saleType === 'table' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'"
              @click="posStore.saleType = 'table'"
            >
              {{ t('pos.table') }}
            </button>
          </div>
          
          <AppInput
            v-if="posStore.saleType === 'table' || posStore.paymentMethod === 'credit'"
            v-model="posStore.tableIdentifier"
            :placeholder="posStore.paymentMethod === 'credit' ? t('pos.tabLabel') : t('pos.tableNumber')"
          />
        </div>

        <!-- Payment Method Selection -->
        <div class="space-y-3 pb-2">
          <div class="flex p-1 bg-slate-900 rounded-lg">
            <button
              class="flex-1 py-1.5 text-sm font-medium rounded-md transition-colors"
              :class="posStore.paymentMethod === 'cash' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'"
              @click="posStore.paymentMethod = 'cash'"
            >
              {{ t('pos.cash') }}
            </button>
            <button
              class="flex-1 py-1.5 text-sm font-medium rounded-md transition-colors"
              :class="posStore.paymentMethod === 'card' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'"
              @click="posStore.paymentMethod = 'card'"
            >
              {{ t('pos.card') }}
            </button>
            <button
              class="flex-1 py-1.5 text-sm font-medium rounded-md transition-colors"
              :class="posStore.paymentMethod === 'credit' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'"
              @click="posStore.paymentMethod = 'credit'"
            >
              {{ t('pos.credit') }}
            </button>
          </div>
        </div>

        <div class="flex gap-2">
          <AppButton variant="ghost" @click="posStore.clearCart(); emit('close')">{{ t('pos.clear') }}</AppButton>
          <AppButton
            full-width
            :loading="confirming"
            :disabled="!canConfirm"
            @click="handleConfirm"
          >
            {{ t('pos.confirmSale') }}
          </AppButton>
        </div>
      </div>
    </template>
  </AppDrawer>
</template>

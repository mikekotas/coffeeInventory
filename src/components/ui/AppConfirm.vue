<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm'
import AppModal from './AppModal.vue'
import AppButton from './AppButton.vue'

const { isOpen, options, accept, cancel } = useConfirm()
</script>

<template>
  <AppModal :open="isOpen" :title="options.title" size="sm" @close="cancel">
    <p class="text-sm text-slate-400">{{ options.message }}</p>
    <template #footer>
      <AppButton variant="ghost" size="sm" @click="cancel">
        {{ options.cancelLabel }}
      </AppButton>
      <AppButton :variant="options.danger ? 'danger' : 'primary'" size="sm" @click="accept">
        {{ options.confirmLabel }}
      </AppButton>
    </template>
  </AppModal>
</template>

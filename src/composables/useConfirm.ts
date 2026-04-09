import { ref } from 'vue'

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

const isOpen = ref(false)
const options = ref<ConfirmOptions>({
  title: '',
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  danger: false,
})
let resolveFn: ((value: boolean) => void) | null = null

export function useConfirm() {
  function confirm(opts: ConfirmOptions): Promise<boolean> {
    options.value = { confirmLabel: 'Confirm', cancelLabel: 'Cancel', danger: false, ...opts }
    isOpen.value = true
    return new Promise((resolve) => {
      resolveFn = resolve
    })
  }

  function accept() {
    isOpen.value = false
    resolveFn?.(true)
    resolveFn = null
  }

  function cancel() {
    isOpen.value = false
    resolveFn?.(false)
    resolveFn = null
  }

  return { isOpen, options, confirm, accept, cancel }
}

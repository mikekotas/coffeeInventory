import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SaleItem {
  product_id: string
  qty_sold: number
  unit_price: number
}

interface ProcessSalePayload {
  items: SaleItem[]
  shift_id?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the user's JWT for RLS enforcement
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload: ProcessSalePayload = await req.json()

    if (!payload.items || payload.items.length === 0) {
      return new Response(JSON.stringify({ error: 'No items in sale' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate items
    for (const item of payload.items) {
      if (!item.product_id || item.qty_sold <= 0 || item.unit_price < 0) {
        return new Response(JSON.stringify({ error: 'Invalid item data' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Calculate total
    const totalAmount = payload.items.reduce(
      (sum, item) => sum + item.qty_sold * item.unit_price,
      0
    )

    // Insert sale header
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        staff_id: user.id,
        shift_id: payload.shift_id || null,
        total_amount: totalAmount,
      })
      .select()
      .single()

    if (saleError || !sale) {
      console.error('Sale insert error:', saleError)
      return new Response(JSON.stringify({ error: 'Failed to create sale', details: saleError?.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Insert sale items (trigger fires for each, deducting stock)
    const saleItems = payload.items.map((item) => ({
      sale_id: sale.id,
      product_id: item.product_id,
      qty_sold: item.qty_sold,
      unit_price: item.unit_price,
    }))

    const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)

    if (itemsError) {
      console.error('Sale items insert error:', itemsError)
      // Rollback: delete the sale header
      await supabase.from('sales').delete().eq('id', sale.id)
      return new Response(JSON.stringify({ error: 'Failed to record sale items', details: itemsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        sale_id: sale.id,
        total_amount: totalAmount,
        items_count: payload.items.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Twilio } from 'https://esm.sh/twilio@4.19.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const twilio = new Twilio(
      Deno.env.get('TWILIO_ACCOUNT_SID') ?? '',
      Deno.env.get('TWILIO_AUTH_TOKEN') ?? ''
    )

    const { action, ...data } = await req.json()

    switch (action) {
      case 'send':
        return await handleSendFax(data, supabaseClient, twilio)
      case 'webhook':
        return await handleFaxWebhook(data, supabaseClient)
      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function handleSendFax(data: any, supabase: any, twilio: any) {
  const { to, mediaUrl, organizationId, patientId } = data

  // Create fax record
  const { data: fax, error: dbError } = await supabase
    .from('faxes')
    .insert({
      organization_id: organizationId,
      patient_id: patientId,
      direction: 'outbound',
      status: 'queued',
      from_number: Deno.env.get('TWILIO_FAX_NUMBER'),
      to_number: to,
      media_url: mediaUrl,
    })
    .select()
    .single()

  if (dbError) throw dbError

  // Send fax using Twilio
  const faxResponse = await twilio.fax.v1.faxes.create({
    to,
    mediaUrl,
    from: Deno.env.get('TWILIO_FAX_NUMBER'),
    statusCallback: `${Deno.env.get('SUPABASE_FUNCTION_URL')}/fax-operations?action=webhook`,
  })

  // Update fax record with Twilio SID
  await supabase
    .from('faxes')
    .update({ twilio_sid: faxResponse.sid })
    .eq('id', fax.id)

  return new Response(
    JSON.stringify({ success: true, fax }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}

async function handleFaxWebhook(data: any, supabase: any) {
  const { FaxSid, Status, NumPages, Duration, ErrorMessage } = data

  // Update fax record
  await supabase
    .from('faxes')
    .update({
      status: Status.toLowerCase(),
      pages: NumPages,
      duration: Duration,
      error_message: ErrorMessage,
    })
    .eq('twilio_sid', FaxSid)

  return new Response(
    JSON.stringify({ success: true }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}

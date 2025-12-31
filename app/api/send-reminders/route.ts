import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    
    // Prosta autentikacija - možete koristiti API key
    const expectedToken = process.env.CRON_SECRET || 'your-secret-token'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await getSupabaseServerClient()
    
    // Pronađi obuke koje ističu za 7 dana
    const today = new Date().toISOString().split('T')[0]
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    const futureDate = sevenDaysFromNow.toISOString().split('T')[0]
    
    const { data: trainings, error } = await supabase
      .from('staff_trainings')
      .select(`
        *,
        staff:staff_id (first_name, last_name, email),
        training_type:training_type_id (name, code)
      `)
      .eq('status', 'valid')
      .gte('expires_date', today)
      .lte('expires_date', futureDate)

    if (error) {
      console.error('Error fetching trainings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let sentCount = 0
    const failedEmails: string[] = []

    // Pošalji email za svaku obuku
    for (const training of trainings || []) {
      try {
        const daysRemaining = Math.ceil(
          (new Date(training.expires_date).getTime() - new Date().getTime()) / 
          (1000 * 60 * 60 * 24)
        )

        await resend.emails.send({
          from: 'Obuke <notifications@aerodrom.me>',
          to: training.staff.email,
          subject: `Podsetnik: ${training.training_type.name} ističe za ${daysRemaining} dana`,
          html: `
            <h3>Podsetnik o isteku obuke</h3>
            <p>Poštovani ${training.staff.first_name} ${training.staff.last_name},</p>
            <p>Vaša obuka <strong>${training.training_type.name}</strong> ističe <strong>${new Date(training.expires_date).toLocaleDateString('sr-RS')}</strong>.</p>
            <p>Preostalo dana: <strong>${daysRemaining}</strong></p>
            <p>Molimo obnovite obuku prije isteka roka.</p>
            <hr>
            <p><small>Ovo je automatska poruka sistema za praćenje obuka.</small></p>
          `
        })
        
        sentCount++
      } catch (err) {
        console.error(`Failed to send email to ${training.staff.email}:`, err)
        failedEmails.push(training.staff.email)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Poslano ${sentCount} email podsetnika`,
      failed_count: failedEmails.length,
      failed_emails: failedEmails,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
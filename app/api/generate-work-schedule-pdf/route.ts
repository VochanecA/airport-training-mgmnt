import { NextRequest, NextResponse } from 'next/server'
import jsPDF from 'jspdf'
import autoTable, { RowInput } from 'jspdf-autotable'

interface CertificateData {
  id: string
  employee: string
  certificate: string
  expiry_date: string
  airport: string
}

interface TrainingData {
  id: string
  employee: string
  training: string
  type: string
  expiry_date: string
  airport: string
}

interface MonthData {
  certificates: CertificateData[]
  trainings: TrainingData[]
}

interface AirportData {
  certificates: CertificateData[]
  trainings: TrainingData[]
}

interface ScheduleData {
  summary: {
    totalCertificates: number
    totalTrainings: number
    uniqueEmployees: number
    byMonthSummary: Array<{
      month: string
      certificates: number
      trainings: number
    }>
    byAirportSummary: Array<{
      airport: string
      certificates: number
      trainings: number
    }>
  }
  byMonth: Record<string, MonthData>
  byAirport: Record<string, AirportData>
  certificates: CertificateData[]
  trainings: TrainingData[]
}

interface RequestBody {
  year: number
  scheduleData: ScheduleData
  notes: string
  managerName: string
  managerTitle: string
  selectedAirports: string[]
  userId: string
}

const monthLabels: Record<string, string> = {
  january: 'Januar',
  february: 'Februar',
  march: 'Mart',
  april: 'April',
  may: 'Maj',
  june: 'Juni',
  july: 'Juli',
  august: 'Avgust',
  september: 'Septembar',
  october: 'Oktobar',
  november: 'Novembar',
  december: 'Decembar'
}

const monthsOrder = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
]

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { year, scheduleData, notes, managerName, managerTitle } = body

    // Validate required fields
    if (!year || !scheduleData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Kreiraj PDF dokument
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // === STRANA 1: NASLOVNA STRANA ===
    doc.setFontSize(24)
    doc.setTextColor(0, 51, 102) // Tamno plava boja
    doc.text('GODIŠNJI PLAN RADA', 105, 40, { align: 'center' })
    
    doc.setFontSize(18)
    doc.setTextColor(0, 0, 0)
    doc.text(`Za godinu: ${year}`, 105, 60, { align: 'center' })
    
    doc.setFontSize(12)
    doc.setTextColor(128, 128, 128)
    const currentDate = new Date()
    doc.text(`Datum kreiranja: ${currentDate.toLocaleDateString('sr-RS')}`, 105, 70, { align: 'center' })
    
    // Linija separator
    doc.setDrawColor(0, 51, 102)
    doc.setLineWidth(0.5)
    doc.line(20, 80, 190, 80)
    
    // Sekcija: Ovim planom se definišu
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text('Ovim planom se definišu:', 20, 95)
    
    doc.setFontSize(12)
    const points = [
      '• Planirani isteci sertifikata po mesecima',
      '• Planirani isteci treninga po mesecima',
      '• Broj polaznika po aerodromima',
      '• Preporuke za organizaciju obuka'
    ]
    
    points.forEach((point: string, index: number) => {
      doc.text(point, 25, 110 + (index * 8))
    })
    
    // Potpis sekcija
    if (managerName) {
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text('Rukovodilac:', 20, 160)
      
      doc.setFontSize(14)
      doc.text(managerName, 20, 170)
      
      if (managerTitle) {
        doc.setFontSize(10)
        doc.setTextColor(128, 128, 128)
        doc.text(managerTitle, 20, 175)
      }
      
      // Linija za potpis
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.5)
      doc.line(20, 180, 80, 180)
      doc.setFontSize(8)
      doc.text('potpis', 40, 185)
    }
    
    // === STRANA 2: NAPOMENE ===
    if (notes && notes.trim().length > 0) {
      doc.addPage()
      doc.setFontSize(16)
      doc.setTextColor(0, 51, 102)
      doc.text('Dodatne napomene i uputstva', 20, 30)
      
      doc.setFontSize(11)
      doc.setTextColor(0, 0, 0)
      
      // Split notes into lines that fit the page width
      const maxWidth = 170
      const lineHeight = 7
      const splitNotes = doc.splitTextToSize(notes, maxWidth)
      
      let yPosition = 45
      splitNotes.forEach((line: string) => {
        if (yPosition > 270) {
          doc.addPage()
          yPosition = 20
        }
        doc.text(line, 20, yPosition)
        yPosition += lineHeight
      })
    }
    
    // === STRANA 3+: DETALJAN PREGLED PO MJESECIMA ===
    doc.addPage()
    doc.setFontSize(16)
    doc.setTextColor(0, 51, 102)
    doc.text('DETALJAN PREGLED PO MJESECIMA', 20, 30)
    
    let currentPageY = 45
    let needsNewPage = false
    
    // Prođi kroz sve mesece po redu
    for (const monthKey of monthsOrder) {
      const monthData = scheduleData.byMonth?.[monthKey]
      const monthLabel = monthLabels[monthKey] || monthKey.charAt(0).toUpperCase() + monthKey.slice(1)
      
      if (monthData && (monthData.certificates.length > 0 || monthData.trainings.length > 0)) {
        // Proveri da li treba nova strana
        if (currentPageY > 250) {
          doc.addPage()
          currentPageY = 30
          needsNewPage = false
        }
        
        if (needsNewPage) {
          doc.addPage()
          currentPageY = 30
          needsNewPage = false
        }
        
        // Naslov meseca
        doc.setFontSize(14)
        doc.setTextColor(51, 51, 51)
        doc.text(`${monthLabel.toUpperCase()}:`, 20, currentPageY)
        currentPageY += 10
        
        // Pripremi podatke za tabelu
        const tableData: RowInput[] = []
        
        // Dodaj sertifikate
        monthData.certificates.forEach((cert: CertificateData) => {
          tableData.push([
            'Sertifikat',
            cert.employee,
            cert.certificate,
            new Date(cert.expiry_date).toLocaleDateString('sr-RS'),
            cert.airport || 'N/A'
          ])
        })
        
        // Dodaj treninge
        monthData.trainings.forEach((training: TrainingData) => {
          tableData.push([
            'Trening',
            training.employee,
            training.training,
            new Date(training.expiry_date).toLocaleDateString('sr-RS'),
            training.airport || 'N/A'
          ])
        })
        
        // Kreiraj tabelu samo ako ima podataka
        if (tableData.length > 0) {
          autoTable(doc, {
            startY: currentPageY,
            head: [['Tip', 'Zaposleni', 'Naziv', 'Datum isteka', 'Aerodrom']],
            body: tableData,
            headStyles: {
              fillColor: [0, 51, 102],
              textColor: [255, 255, 255],
              fontStyle: 'bold'
            },
            alternateRowStyles: {
              fillColor: [240, 240, 240]
            },
            styles: {
              fontSize: 9,
              cellPadding: 3,
              overflow: 'linebreak',
              cellWidth: 'wrap'
            },
            columnStyles: {
              0: { cellWidth: 20 }, // Tip
              1: { cellWidth: 40 }, // Zaposleni
              2: { cellWidth: 60 }, // Naziv
              3: { cellWidth: 30 }, // Datum
              4: { cellWidth: 40 }  // Aerodrom
            },
            margin: { left: 20, right: 20 },
            didDrawPage: () => {
              needsNewPage = true
            }
          })
          
          // Ažuriraj trenutnu Y poziciju posle tabele
          const lastAutoTable = (doc as any).lastAutoTable
          if (lastAutoTable && lastAutoTable.finalY) {
            currentPageY = lastAutoTable.finalY + 15
          } else {
            currentPageY += tableData.length * 10 + 30
          }
        }
      }
    }
    
    // === ZADNJA STRANA: STATISTIČKI PREGLED ===
    doc.addPage()
    doc.setFontSize(16)
    doc.setTextColor(0, 51, 102)
    doc.text('STATISTIČKI PREGLED', 20, 30)
    
    let statsY = 50
    
    // Statistički podaci
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text(`Ukupno sertifikata koji ističu: ${scheduleData.summary.totalCertificates}`, 20, statsY)
    statsY += 15
    
    doc.text(`Ukupno treninga koji ističu: ${scheduleData.summary.totalTrainings}`, 20, statsY)
    statsY += 15
    
    doc.text(`Broj zaposlenih sa isticanjima: ${scheduleData.summary.uniqueEmployees}`, 20, statsY)
    statsY += 25
    
    // Tabela po mjesecima
    doc.setFontSize(14)
    doc.setTextColor(0, 51, 102)
    doc.text('Po mjesecima:', 20, statsY)
    statsY += 15
    
    const monthTableData: RowInput[] = []
    
    scheduleData.summary.byMonthSummary.forEach((monthSummary) => {
      monthTableData.push([
        monthSummary.month,
        monthSummary.certificates.toString(),
        monthSummary.trainings.toString(),
        (monthSummary.certificates + monthSummary.trainings).toString()
      ])
    })
    
    if (monthTableData.length > 0) {
      autoTable(doc, {
        startY: statsY,
        head: [['Mjesec', 'Sertifikati', 'Treningi', 'Ukupno']],
        body: monthTableData,
        headStyles: {
          fillColor: [0, 51, 102],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        },
        styles: {
          fontSize: 10,
          cellPadding: 4
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 35 },
          2: { cellWidth: 35 },
          3: { cellWidth: 35 }
        },
        margin: { left: 20, right: 20 }
      })
      
      statsY = (doc as any).lastAutoTable?.finalY || statsY + 100
    }
    
    // Tabela po aerodromima
    statsY += 15
    doc.setFontSize(14)
    doc.setTextColor(0, 51, 102)
    doc.text('Po aerodromima:', 20, statsY)
    statsY += 15
    
    const airportTableData: RowInput[] = []
    
    scheduleData.summary.byAirportSummary.forEach((airportSummary) => {
      airportTableData.push([
        airportSummary.airport,
        airportSummary.certificates.toString(),
        airportSummary.trainings.toString(),
        (airportSummary.certificates + airportSummary.trainings).toString()
      ])
    })
    
    if (airportTableData.length > 0) {
      autoTable(doc, {
        startY: statsY,
        head: [['Aerodrom', 'Sertifikati', 'Treningi', 'Ukupno']],
        body: airportTableData,
        headStyles: {
          fillColor: [0, 51, 102],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        },
        styles: {
          fontSize: 10,
          cellPadding: 4
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 30 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 }
        },
        margin: { left: 20, right: 20 }
      })
    }
    
    // Generiši PDF kao ArrayBuffer
    const pdfArrayBuffer = doc.output('arraybuffer')
    
    // Konvertuj ArrayBuffer u Buffer
    const pdfBuffer = Buffer.from(pdfArrayBuffer)
    
    // Vrati kao response sa ispravnim headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Godisnji_Plan_Rada_${year}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Greška pri generisanju PDF-a' },
      { status: 500 }
    )
  }
}
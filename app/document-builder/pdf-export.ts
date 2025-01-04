import jsPDF from 'jspdf'

export function exportToPDF(elements: any[]) {
  const pdf = new jsPDF()
  let yOffset = 10

  elements.forEach((element, index) => {
    if (index > 0) {
      yOffset += 10
    }

    pdf.setFontSize(12)
    pdf.text(element.label, 10, yOffset)
    yOffset += 7

    if (element.description) {
      pdf.setFontSize(10)
      pdf.text(element.description, 10, yOffset)
      yOffset += 7
    }

    pdf.setFontSize(12)

    switch (element.type) {
      case 'staticText':
        // Static text is already handled by label and description
        break
      case 'text':
        pdf.rect(10, yOffset, 180, 10)
        break
      case 'checkbox':
        pdf.rect(10, yOffset, 5, 5)
        pdf.text(element.label, 20, yOffset + 4)
        break
      case 'dropdown':
      case 'radio':
        (element.options || []).forEach((option: string, optionIndex: number) => {
          if (element.type === 'dropdown') {
            pdf.rect(10, yOffset, 180, 7)
            pdf.text(option, 15, yOffset + 5)
          } else {
            pdf.circle(12, yOffset + 3, 1.5)
            pdf.text(option, 20, yOffset + 4)
          }
          yOffset += 8
        })
        break
    }

    yOffset += 10
  })

  pdf.save('document.pdf')
}


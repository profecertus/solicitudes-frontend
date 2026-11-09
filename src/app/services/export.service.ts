import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Solicitud } from '../models/solicitud.model';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  exportarExcel(solicitudes: Solicitud[], nombreArchivo: string = 'Reporte_Solicitudes'): void {
    // 1. Hoja principal: Resumen de Solicitudes
    const dataResumen = solicitudes.map(s => ({
      'Código': s.codigo,
      'Fecha Creación': new Date(s.fechaCreacion).toLocaleDateString('es-PE'),
      'Solicitante': s.solicitanteNombre,
      'Centro de Costo': s.centroCostoNombre || 'General',
      'Estado': s.estadoNombre,
      'Monto Total (PEN)': Number(s.montoTotal.toFixed(2)),
      'Cant. Ítems': s.detalles?.length || 0,
      'Motivo': s.motivo
    }));

    // 2. Hoja secundaria: Detalle de Ítems / Renglones
    const dataDetalles: any[] = [];
    solicitudes.forEach(s => {
      if (s.detalles && s.detalles.length > 0) {
        s.detalles.forEach(d => {
          dataDetalles.push({
            'Código Solicitud': s.codigo,
            'Concepto': d.concepto,
            'Cantidad': d.cantidad,
            'Precio Unitario (PEN)': Number(d.precioUnitario.toFixed(2)),
            'Importe Total (PEN)': Number(d.importe.toFixed(2))
          });
        });
      }
    });

    // Crear libro de trabajo (Workbook)
    const wb: XLSX.WorkBook = XLSX.utils.book_new();

    // Hoja 1
    const wsResumen: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataResumen);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Solicitudes');

    // Hoja 2 (si hay detalles)
    if (dataDetalles.length > 0) {
      const wsDetalles: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataDetalles);
      XLSX.utils.book_append_sheet(wb, wsDetalles, 'Detalle_Items');
    }

    // Descargar archivo
    const fechaStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `${nombreArchivo}_${fechaStr}.xlsx`);
  }

  exportarPdf(solicitudes: Solicitud[], nombreArchivo: string = 'Reporte_Solicitudes', filtrosTexto: string = ''): void {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor = [2, 75, 152]; // #024b98
    const totalMonto = solicitudes.reduce((acc, s) => acc + s.montoTotal, 0);

    // Encabezado Corporativo
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 297, 18, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SOLICITUDES APP — PORTAL DE COMPRAS Y TESORERÍA', 14, 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de emisión: ${new Date().toLocaleString('es-PE')}`, 215, 12);

    // Título del Reporte
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte Consolidado de Solicitudes de Compra', 14, 30);

    // Subtítulo con resumen de filtros
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const sub = filtrosTexto ? `Filtros aplicados: ${filtrosTexto}` : 'Filtros aplicados: Todos los registros';
    doc.text(sub, 14, 36);

    // Métricas resumen
    doc.text(`Total Solicitudes: ${solicitudes.length}   |   Presupuesto Total Filtrado: PEN ${totalMonto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, 42);

    // Preparar filas de tabla
    const bodyData = solicitudes.map((s, index) => [
      (index + 1).toString(),
      s.codigo,
      new Date(s.fechaCreacion).toLocaleDateString('es-PE'),
      s.solicitanteNombre,
      s.centroCostoNombre || 'General',
      s.motivo.length > 35 ? s.motivo.substring(0, 32) + '...' : s.motivo,
      s.estadoNombre,
      `PEN ${s.montoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ]);

    // Tabla con autoTable
    autoTable(doc, {
      startY: 47,
      head: [['#', 'Código', 'Fecha', 'Solicitante', 'Centro Costo', 'Motivo', 'Estado', 'Monto Total']],
      body: bodyData,
      theme: 'striped',
      headStyles: {
        fillColor: [2, 75, 152],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'left'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { fontStyle: 'bold', cellWidth: 26 },
        2: { cellWidth: 24 },
        3: { cellWidth: 38 },
        4: { cellWidth: 42 },
        5: { cellWidth: 65 },
        6: { halign: 'center', cellWidth: 28 },
        7: { halign: 'right', fontStyle: 'bold', cellWidth: 32 }
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 2.5,
        textColor: [30, 41, 59]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      foot: [[
        '', '', '', '', '', 'TOTAL CONSOLIDADO:',
        `${solicitudes.length} reg.`,
        `PEN ${totalMonto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ]],
      footStyles: {
        fillColor: [226, 232, 240],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'right'
      },
      didDrawPage: (data) => {
        // Pie de página con numeración
        const str = `Página ${data.pageNumber} de ${(doc as any).internal.getNumberOfPages()}`;
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(str, 260, 202);
      }
    });

    const fechaStr = new Date().toISOString().slice(0, 10);
    doc.save(`${nombreArchivo}_${fechaStr}.pdf`);
  }
}

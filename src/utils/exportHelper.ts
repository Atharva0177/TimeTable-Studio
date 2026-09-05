import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Timetable } from '../types';

/**
 * Check if running inside a sandboxed iframe where window.print() or modals
 * are blocked by browser iframe security.
 */
export const isSandboxedIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

/**
 * Helper to get the best export element:
 * Prioritize the dedicated, clean unconstrained #standalone-export-timetable-root.
 * Fallback to #printable-timetable-root if needed.
 */
const getExportElement = (): HTMLElement | null => {
  const standalone = document.getElementById('standalone-export-timetable-root');
  if (standalone) return standalone;
  return document.getElementById('printable-timetable-root');
};

/**
 * High-resolution PNG image download for the timetable.
 * Uses the dedicated standalone export renderer to ensure:
 * 1. 100% full unconstrained width (all days spacious, never compressed or squished)
 * 2. 100% full unclipped height (all rows from first to last, zero cutoff)
 * 3. Zero UI clutter (no scrollbars, no trash buttons, no drag handles)
 * 4. Crisp 2x Retina resolution with vector typography
 */
export const exportTimetableToPng = async (timetable: Timetable): Promise<boolean> => {
  const element = getExportElement();
  if (!element) {
    console.error('Export target element not found');
    return false;
  }

  // Calculate actual unconstrained dimensions
  const computedWidth = Math.max(element.scrollWidth, element.offsetWidth, 1200);
  const computedHeight = Math.max(element.scrollHeight, element.offsetHeight, 600);

  try {
    // Wait briefly for all fonts and assets to stabilize
    await new Promise((resolve) => setTimeout(resolve, 80));

    let dataUrl: string;
    try {
      dataUrl = await toPng(element, {
        width: computedWidth,
        height: computedHeight,
        canvasWidth: computedWidth,
        canvasHeight: computedHeight,
        pixelRatio: 2, // Crisp 2x Retina resolution
        backgroundColor: timetable.theme?.backgroundColor || '#141414',
        cacheBust: true,
        style: {
          transform: 'none',
          position: 'static',
          margin: '0',
          width: `${computedWidth}px`,
          height: `${computedHeight}px`,
          overflow: 'visible',
          opacity: '1',
        },
        filter: (node) => {
          if (node instanceof HTMLElement && node.classList.contains('no-print')) {
            return false;
          }
          return true;
        },
      });
    } catch (fontError) {
      console.warn('Initial toPng failed, retrying with skipFonts', fontError);
      dataUrl = await toPng(element, {
        width: computedWidth,
        height: computedHeight,
        canvasWidth: computedWidth,
        canvasHeight: computedHeight,
        pixelRatio: 2,
        backgroundColor: timetable.theme?.backgroundColor || '#141414',
        skipFonts: true,
        style: {
          transform: 'none',
          position: 'static',
          margin: '0',
          width: `${computedWidth}px`,
          height: `${computedHeight}px`,
          overflow: 'visible',
          opacity: '1',
        },
      });
    }

    const link = document.createElement('a');
    const cleanName = (timetable.name || 'Timetable').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `${cleanName}_schedule.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error('Failed to export PNG:', err);
    return false;
  }
};

/**
 * Direct PDF Document Export using jsPDF.
 * Renders the complete timetable to a true PDF file with zero cutoff,
 * proper margins, and landscape/portrait paper dimensions.
 */
export const exportTimetableToPdf = async (
  timetable: Timetable,
  pageSize: 'a4' | 'a3' | 'letter' = 'a4',
  orientation: 'landscape' | 'portrait' = 'landscape'
): Promise<boolean> => {
  const element = getExportElement();
  if (!element) {
    console.error('Export target element not found for PDF generation');
    return false;
  }

  const computedWidth = Math.max(element.scrollWidth, element.offsetWidth, 1200);
  const computedHeight = Math.max(element.scrollHeight, element.offsetHeight, 600);

  try {
    // Generate crisp 2x PNG raster for insertion into PDF
    const dataUrl = await toPng(element, {
      width: computedWidth,
      height: computedHeight,
      canvasWidth: computedWidth,
      canvasHeight: computedHeight,
      pixelRatio: 2,
      backgroundColor: timetable.theme?.backgroundColor || '#141414',
      cacheBust: true,
      style: {
        transform: 'none',
        position: 'static',
        margin: '0',
        width: `${computedWidth}px`,
        height: `${computedHeight}px`,
        overflow: 'visible',
        opacity: '1',
      },
    });

    // Initialize jsPDF document
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: pageSize,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 8; // 8mm margin around edges
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;

    // Calculate aspect-ratio scaling to fit on single page perfectly
    const imgRatio = computedWidth / computedHeight;
    const pageRatio = availableWidth / availableHeight;

    let finalWidth = availableWidth;
    let finalHeight = availableHeight;

    if (imgRatio > pageRatio) {
      // Width constrained
      finalWidth = availableWidth;
      finalHeight = availableWidth / imgRatio;
    } else {
      // Height constrained
      finalHeight = availableHeight;
      finalWidth = availableHeight * imgRatio;
    }

    // Center on page
    const posX = margin + (availableWidth - finalWidth) / 2;
    const posY = margin + (availableHeight - finalHeight) / 2;

    pdf.addImage(dataUrl, 'PNG', posX, posY, finalWidth, finalHeight, undefined, 'FAST');

    const cleanName = (timetable.name || 'Timetable').replace(/[^a-zA-Z0-9_-]/g, '_');
    pdf.save(`${cleanName}_schedule.pdf`);
    return true;
  } catch (err) {
    console.error('Failed to export PDF:', err);
    return false;
  }
};

/**
 * Export timetable entries as CSV spreadsheet
 */
export const exportTimetableToCsv = (timetable: Timetable): void => {
  const headers = ['Day', 'Period / Time', 'Title', 'Code', 'Teacher', 'Room', 'Category'];
  const rows: string[][] = [];

  for (const day of timetable.days) {
    for (const slot of timetable.timeSlots) {
      const entry = timetable.entries.find((e) => e.dayId === day.id && e.slotId === slot.id);
      if (entry) {
        rows.push([
          `"${day.name.replace(/"/g, '""')}"`,
          `"${slot.name.replace(/"/g, '""')} (${slot.start}-${slot.end})"`,
          `"${(entry.title || '').replace(/"/g, '""')}"`,
          `"${(entry.shortCode || '').replace(/"/g, '""')}"`,
          `"${(entry.teacher || '').replace(/"/g, '""')}"`,
          `"${(entry.room || '').replace(/"/g, '""')}"`,
          `"${(entry.category || '').replace(/"/g, '""')}"`,
        ]);
      }
    }
  }

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  const cleanName = (timetable.name || 'Timetable').replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${cleanName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export timetable as structured JSON for complete backup & import
 */
export const exportTimetableToJson = (timetable: Timetable): void => {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(timetable, null, 2));
  const link = document.createElement('a');
  const cleanName = (timetable.name || 'Timetable').replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `${cleanName}_backup.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generate a standalone, printable HTML document file with full unconstrained styling.
 */
export const downloadPrintableHtml = (timetable: Timetable): void => {
  const cleanName = (timetable.name || 'Timetable').replace(/[^a-zA-Z0-9_-]/g, '_');

  const tableHeaderDays = timetable.days
    .map((day) => `<th style="padding: 12px 14px; background: #1e293b; color: #f8fafc; border: 1px solid #334155; font-size: 13px; font-weight: 700; text-align: center; text-transform: uppercase;">${day.name}</th>`)
    .join('');

  const tableRows = timetable.timeSlots
    .map((slot) => {
      const isBreak = slot.isBreak;
      const dayCells = timetable.days
        .map((day) => {
          const entry = timetable.entries.find((e) => e.dayId === day.id && e.slotId === slot.id);
          if (!entry) {
            return `<td style="padding: 10px; border: 1px solid #334155; font-size: 11px; background: ${isBreak ? 'rgba(255,255,255,0.03)' : '#0f172a'}; min-height: 80px;"></td>`;
          }
          const bg = entry.style?.background || entry.color || '#1e293b';
          const fg = entry.style?.textColor || entry.textColor || '#f8fafc';
          return `
            <td style="padding: 10px; border: 1px solid #334155; font-size: 11px; background: ${bg}; color: ${fg}; vertical-align: top; border-radius: 6px;">
              <div style="font-weight: 800; font-size: 13px; margin-bottom: 3px; line-height: 1.3;">${entry.title}</div>
              ${entry.shortCode ? `<div style="font-size: 10px; font-family: monospace; opacity: 0.75; margin-bottom: 4px;">${entry.shortCode}</div>` : ''}
              ${entry.teacher ? `<div style="font-size: 10px; opacity: 0.85; margin-top: 4px;">👤 ${entry.teacher}</div>` : ''}
              ${entry.room ? `<div style="font-size: 10px; opacity: 0.85; margin-top: 2px;">📍 ${entry.room}</div>` : ''}
            </td>
          `;
        })
        .join('');

      return `
        <tr>
          <td style="padding: 12px 14px; border: 1px solid #334155; background: #1e293b; color: #f1f5f9; font-weight: 600; font-size: 12px; width: 180px; min-width: 180px;">
            <div style="font-weight: 700; color: #f8fafc; font-size: 13px;">${slot.name}</div>
            <div style="font-size: 11px; color: #94a3b8; font-family: monospace; margin-top: 2px;">${slot.start} – ${slot.end}</div>
          </td>
          ${dayCells}
        </tr>
      `;
    })
    .join('');

  const totalWidth = 180 + timetable.days.length * 170;

  const htmlDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${timetable.institutionName || timetable.name || 'Academic Schedule'}</title>
  <style>
    @page { size: landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 30px;
      color: #f8fafc;
      background: #0f172a;
    }
    .container {
      min-width: ${totalWidth}px;
      margin: 0 auto;
    }
    .header {
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #334155;
      padding-bottom: 16px;
    }
    .header h1 {
      margin: 0 0 6px 0;
      font-size: 26px;
      font-weight: 800;
      color: #38bdf8;
    }
    .header p {
      margin: 0;
      font-size: 13px;
      color: #94a3b8;
    }
    .actions {
      margin-bottom: 20px;
    }
    .btn {
      padding: 10px 20px;
      background: #38bdf8;
      color: #0f172a;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 700;
    }
    table {
      width: ${totalWidth}px;
      min-width: ${totalWidth}px;
      border-collapse: collapse;
      table-layout: fixed;
    }
    @media print {
      .no-print { display: none !important; }
      body { padding: 0 !important; background: #ffffff !important; color: #0f172a !important; }
      th { background: #f1f5f9 !important; color: #0f172a !important; border-color: #cbd5e1 !important; }
      td { border-color: #cbd5e1 !important; }
      .header h1 { color: #0f172a !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="no-print actions">
      <button class="btn" onclick="window.print()">🖨️ Open Print Dialog</button>
    </div>
    <div class="header">
      <div>
        <h1>${timetable.institutionName || timetable.name || 'Academic Schedule'}</h1>
        <p>${timetable.subTitle ? `${timetable.subTitle} • ` : ''}${timetable.academicYear ? `${timetable.academicYear} • ` : ''}Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #94a3b8;">Schedule Type</span>
        <div style="font-size: 16px; font-weight: 800; text-transform: capitalize; color: #f8fafc;">${timetable.type} Planner</div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="padding: 12px 14px; background: #1e293b; color: #f8fafc; border: 1px solid #334155; font-size: 12px; font-weight: 800; text-align: left; width: 180px;">Time / Period</th>
          ${tableHeaderDays}
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`;

  const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${cleanName}_printable.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

/**
 * Smart print dispatcher.
 */
export const triggerTimetablePrint = (
  onSandboxDetected?: () => void
): { success: boolean; sandboxed: boolean } => {
  if (isSandboxedIframe()) {
    if (onSandboxDetected) {
      onSandboxDetected();
    }
    return { success: false, sandboxed: true };
  }

  try {
    window.print();
    return { success: true, sandboxed: false };
  } catch (err) {
    console.warn('window.print() encountered an error:', err);
    if (onSandboxDetected) {
      onSandboxDetected();
    }
    return { success: false, sandboxed: true };
  }
};

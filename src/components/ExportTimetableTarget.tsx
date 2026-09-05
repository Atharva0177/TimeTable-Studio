import React from 'react';
import {
  Clock,
  MapPin,
  User,
  Coffee,
  Utensils,
  Sun,
  BookOpen,
} from 'lucide-react';
import { Timetable } from '../types';
import { IconRenderer } from './IconRenderer';

interface ExportTimetableTargetProps {
  timetable: Timetable;
}

export const ExportTimetableTarget: React.FC<ExportTimetableTargetProps> = ({ timetable }) => {
  const dayCount = timetable.days.length || 5;
  const periodColWidth = 180;
  // Ensure generous width per day column so texts never wrap or squish
  const dayColWidth = Math.max(175, timetable.theme.cellWidth || 170);
  const totalTableWidth = periodColWidth + dayCount * dayColWidth;
  const paddingX = 36;
  const totalCanvasWidth = totalTableWidth + paddingX * 2;

  const primaryColor = timetable.theme.primaryColor || '#c5a059';
  const bgColor = timetable.theme.backgroundColor || '#141414';
  const headerBg = timetable.theme.headerBackground || '#181818';
  const headerTextColor = timetable.theme.headerTextColor || '#c5a059';
  const timeColBg = timetable.theme.timeColumnBackground || '#141414';
  const timeColText = timetable.theme.timeColumnTextColor || '#a3a3a3';
  const borderColor = timetable.theme.borderColor || '#262626';

  return (
    <div
      id="standalone-export-timetable-root"
      style={{
        width: `${totalCanvasWidth}px`,
        minWidth: `${totalCanvasWidth}px`,
        maxWidth: `${totalCanvasWidth}px`,
        backgroundColor: bgColor,
        fontFamily: timetable.theme.fontFamily || 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#ededed',
        padding: `${paddingX}px`,
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'visible',
        display: 'block',
      }}
      className="export-canvas-container"
    >
      {/* 1. Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '20px',
          marginBottom: '24px',
          borderBottom: `2px solid ${borderColor}`,
          gap: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          {timetable.logoUrl && (
            <img
              src={timetable.logoUrl}
              alt="Logo"
              style={{
                width: '64px',
                height: '64px',
                objectFit: 'contain',
                borderRadius: '12px',
                border: `1px solid ${borderColor}`,
                backgroundColor: '#1a1a1a',
                padding: '4px',
              }}
              referrerPolicy="no-referrer"
            />
          )}
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: 800,
                color: primaryColor,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
              }}
            >
              {timetable.institutionName || timetable.name}
            </h1>
            {timetable.subTitle && (
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '14px',
                  color: '#a3a3a3',
                  fontWeight: 500,
                }}
              >
                {timetable.subTitle}
              </p>
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
              {timetable.academicYear && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: primaryColor,
                    backgroundColor: `${primaryColor}15`,
                    border: `1px solid ${primaryColor}40`,
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {timetable.academicYear}
                </span>
              )}
              {timetable.customBadges?.map((b) => (
                <span
                  key={b.id}
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: b.color || primaryColor,
                    backgroundColor: `${b.color || primaryColor}15`,
                    border: `1px solid ${b.color || primaryColor}40`,
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {b.label}
                </span>
              ))}
              {timetable.description && (
                <span style={{ fontSize: '12px', color: '#737373' }}>
                  {timetable.description}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', shrink: 0 }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#888888',
              display: 'block',
            }}
          >
            Schedule Type
          </span>
          <span
            style={{
              fontSize: '15px',
              fontWeight: 800,
              textTransform: 'capitalize',
              color: '#f5f5f5',
              display: 'block',
              marginTop: '2px',
            }}
          >
            {timetable.type} Planner
          </span>
        </div>
      </div>

      {/* 2. Full Uncompressed Table */}
      <table
        style={{
          width: `${totalTableWidth}px`,
          minWidth: `${totalTableWidth}px`,
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
          border: `1px solid ${borderColor}`,
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <colgroup>
          <col style={{ width: `${periodColWidth}px` }} />
          {timetable.days.map((day) => (
            <col key={day.id} style={{ width: `${dayColWidth}px` }} />
          ))}
        </colgroup>

        <thead>
          <tr>
            {/* Corner Header */}
            <th
              style={{
                width: `${periodColWidth}px`,
                padding: '14px 16px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                backgroundColor: headerBg,
                color: headerTextColor,
                border: `1px solid ${borderColor}`,
              }}
            >
              Time / Period
            </th>

            {/* Day Headers */}
            {timetable.days.map((day) => (
              <th
                key={day.id}
                style={{
                  width: `${dayColWidth}px`,
                  padding: '14px 12px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  backgroundColor: headerBg,
                  color: headerTextColor,
                  border: `1px solid ${borderColor}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {day.name}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {timetable.timeSlots.map((slot) => {
            const isBreakRow = slot.isBreak;

            return (
              <tr key={slot.id}>
                {/* Period Time Column */}
                <td
                  style={{
                    width: `${periodColWidth}px`,
                    padding: '12px 14px',
                    verticalAlign: 'middle',
                    backgroundColor: timeColBg,
                    color: timeColText,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '12px',
                        color: '#ededed',
                        lineHeight: 1.3,
                      }}
                    >
                      {slot.name}
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: '#888888',
                      }}
                    >
                      <Clock size={11} color="#888888" />
                      <span>
                        {slot.start} – {slot.end}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Day Cells */}
                {timetable.days.map((day) => {
                  const entriesInCell = timetable.entries.filter(
                    (e) => e.dayId === day.id && e.slotId === slot.id
                  );
                  const entry =
                    entriesInCell.length > 0
                      ? entriesInCell[entriesInCell.length - 1]
                      : undefined;

                  const cellHeight = Math.max(90, timetable.theme.cellHeight || 85);

                  return (
                    <td
                      key={day.id}
                      style={{
                        width: `${dayColWidth}px`,
                        height: `${cellHeight}px`,
                        padding: '6px',
                        verticalAlign: 'top',
                        backgroundColor: isBreakRow ? `${primaryColor}08` : 'transparent',
                        border: `1px solid ${borderColor}`,
                        boxSizing: 'border-box',
                      }}
                    >
                      {entry ? (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            minHeight: `${cellHeight - 12}px`,
                            backgroundColor: entry.style?.background || entry.color || '#1e293b',
                            color: entry.style?.textColor || entry.textColor || '#0f172a',
                            borderRadius: `${entry.style?.borderRadius ?? timetable.theme.borderRadius ?? 10}px`,
                            border: `1px solid ${entry.style?.borderColor || 'rgba(0,0,0,0.12)'}`,
                            padding: '8px 10px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxSizing: 'border-box',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          }}
                        >
                          {/* Subject Header: Title + Icon */}
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                gap: '6px',
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: entry.style?.fontWeight === 'bold' ? 800 : 700,
                                  fontStyle: entry.style?.fontStyle === 'italic' ? 'italic' : 'normal',
                                  fontSize: '12px',
                                  lineHeight: 1.25,
                                  wordBreak: 'break-word',
                                }}
                              >
                                {entry.title}
                              </span>
                              {timetable.theme.showIcons && entry.icon && (
                                <div style={{ shrink: 0, opacity: 0.85 }}>
                                  <IconRenderer name={entry.icon} size={15} />
                                </div>
                              )}
                            </div>
                            {entry.shortCode && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontFamily: 'monospace',
                                  fontWeight: 600,
                                  opacity: 0.75,
                                  display: 'block',
                                  marginTop: '3px',
                                  letterSpacing: '0.04em',
                                }}
                              >
                                {entry.shortCode}
                              </span>
                            )}
                          </div>

                          {/* Subject Footer: Teacher & Room */}
                          <div
                            style={{
                              marginTop: '6px',
                              paddingTop: '4px',
                              borderTop: '1px solid rgba(0,0,0,0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '10px',
                              opacity: 0.85,
                              lineHeight: 1,
                              gap: '4px',
                            }}
                          >
                            {timetable.theme.showTeacher && entry.teacher ? (
                              <span
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                <User size={10} style={{ flexShrink: 0 }} />
                                <span>{entry.teacher}</span>
                              </span>
                            ) : null}

                            {timetable.theme.showRoom && entry.room ? (
                              <span
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  marginLeft: 'auto',
                                  fontWeight: 600,
                                  flexShrink: 0,
                                }}
                              >
                                <MapPin size={10} style={{ flexShrink: 0 }} />
                                <span>{entry.room}</span>
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ) : isBreakRow ? (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            opacity: 0.35,
                            color: primaryColor,
                          }}
                        >
                          {slot.name.toLowerCase().includes('lunch') ? (
                            <Utensils size={13} />
                          ) : (
                            <Coffee size={13} />
                          )}
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 3. Footer Metadata */}
      <div
        style={{
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: `1px solid ${borderColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#737373',
        }}
      >
        <span>
          Generated with Timetable Studio • {timetable.days.length} Days Active • {timetable.timeSlots.length} Scheduled Periods
        </span>
        <span>
          Official Academic Record • Status: Active
        </span>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Sheet, SheetFormat } from '../model/types';
import {
  FileText,
  Check,
  X,
  Calendar,
  User,
  Folder,
  Hash,
  ShieldCheck,
  Edit3,
  Layers,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sheet: Sheet;
  onSave: (updatedSheet: Sheet) => void;
}

export const CARTIGLIO_LIMITS = {
  title: 48,
  project: 36,
  author: 18,
  date: 12,
  revision: 10,
  sheetNo: 8,
  standard: 18,
} as const;

export const CartiglioModal: React.FC<Props> = ({ isOpen, onClose, sheet, onSave }) => {
  const [project, setProject] = useState(sheet.project || '');
  const [title, setTitle] = useState(sheet.title || '');
  const [author, setAuthor] = useState(sheet.author || '');
  const [date, setDate] = useState(sheet.date || '');
  const [revision, setRevision] = useState(sheet.revision || '');
  const [sheetNo, setSheetNo] = useState(sheet.sheetNo || '1/1');
  const [standard, setStandard] = useState(sheet.standard || 'CEI / IEC 60617');
  const [format, setFormat] = useState<SheetFormat>(sheet.format || 'A3');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>(
    sheet.orientation || 'landscape'
  );

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setProject(sheet.project || '');
      setTitle(sheet.title || '');
      setAuthor(sheet.author || '');
      setDate(sheet.date || '');
      setRevision(sheet.revision || '');
      setSheetNo(sheet.sheetNo || '1/1');
      setStandard(sheet.standard || 'CEI / IEC 60617');
      setFormat(sheet.format || 'A3');
      setOrientation(sheet.orientation || 'landscape');

      setTimeout(() => {
        titleInputRef.current?.focus();
        titleInputRef.current?.select();
      }, 50);
    }
  }, [isOpen, sheet]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    onSave({
      ...sheet,
      project: project.trim(),
      title: title.trim(),
      author: author.trim(),
      date: date.trim(),
      revision: revision.trim(),
      sheetNo: sheetNo.trim(),
      standard: standard.trim(),
      format,
      orientation,
    });
    onClose();
  };

  const handleSetToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
  };

  const tbW = 420;
  const tbH = 82;

  const renderBadge = (current: string, max: number) => {
    const isNear = current.length >= max - 3;
    const isFull = current.length >= max;
    return (
      <span
        style={{
          fontSize: 11,
          fontFamily: 'monospace',
          color: isFull ? '#ef4444' : isNear ? '#f59e0b' : '#94a3b8',
          backgroundColor: isFull
            ? 'rgba(239, 68, 68, 0.12)'
            : isNear
            ? 'rgba(245, 158, 11, 0.12)'
            : 'rgba(148, 163, 184, 0.08)',
          padding: '2px 6px',
          borderRadius: 4,
          border: `1px solid ${
            isFull ? 'rgba(239, 68, 68, 0.3)' : isNear ? 'rgba(245, 158, 11, 0.3)' : 'transparent'
          }`,
        }}
      >
        {current.length}/{max}
      </span>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#1e293b',
          color: '#f8fafc',
          borderRadius: 12,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          width: '100%',
          maxWidth: 620,
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.15s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #334155',
            backgroundColor: '#0f172a',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <Edit3 size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
                Modifica Cartiglio Tecnico
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
                Norma CEI / ISO 7200 &bull; Dati identificativi della tavola da disegno
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Live Title Block Preview Card */}
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                Anteprima Grafica in Tempo Reale
              </span>
              <span style={{ fontSize: 11, color: '#38bdf8' }}>
                Dimensioni: {tbW} &times; {tbH} px
              </span>
            </div>

            <div
              style={{
                width: '100%',
                borderRadius: 4,
                overflow: 'hidden',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <svg
                viewBox={`0 0 ${tbW} ${tbH}`}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              >
                <defs>
                  <clipPath id="modalTitleClip">
                    <rect x={6} y={24} width={tbW - 12} height={28} />
                  </clipPath>
                  <clipPath id="modalProjectClip">
                    <rect x={6} y={0} width={258} height={24} />
                  </clipPath>
                  <clipPath id="modalAuthorClip">
                    <rect x={6} y={52} width={110} height={30} />
                  </clipPath>
                  <clipPath id="modalDateClip">
                    <rect x={124} y={52} width={82} height={30} />
                  </clipPath>
                  <clipPath id="modalRevisionClip">
                    <rect x={214} y={52} width={77} height={30} />
                  </clipPath>
                  <clipPath id="modalStandardClip">
                    <rect x={299} y={52} width={115} height={30} />
                  </clipPath>
                  <clipPath id="modalSheetNoClip">
                    <rect x={364} y={0} width={50} height={24} />
                  </clipPath>
                  <clipPath id="modalFormatClip">
                    <rect x={274} y={0} width={82} height={24} />
                  </clipPath>
                </defs>

                <rect x={0} y={0} width={tbW} height={tbH} fill="#f8fafc" stroke="#475569" strokeWidth={1.2} />

                {/* Horizontal dividing lines */}
                <line x1={0} y1={24} x2={tbW} y2={24} stroke="#475569" strokeWidth={1} />
                <line x1={0} y1={52} x2={tbW} y2={52} stroke="#475569" strokeWidth={1} />

                {/* Row 1 vertical dividing lines */}
                <line x1={270} y1={0} x2={270} y2={24} stroke="#475569" strokeWidth={1} />
                <line x1={360} y1={0} x2={360} y2={24} stroke="#475569" strokeWidth={1} />

                {/* Row 3 vertical dividing lines */}
                <line x1={120} y1={52} x2={120} y2={tbH} stroke="#475569" strokeWidth={1} />
                <line x1={210} y1={52} x2={210} y2={tbH} stroke="#475569" strokeWidth={1} />
                <line x1={295} y1={52} x2={295} y2={tbH} stroke="#475569" strokeWidth={1} />

                {/* Row 1 Content */}
                <text x={8} y={10} fontSize={7.5} fill="#64748b" fontWeight="600">IMPIANTO / PROGETTO:</text>
                <g clipPath="url(#modalProjectClip)">
                  <text x={8} y={20} fontSize={10} fontWeight="bold" fill="#0f172a">
                    {project || 'PROGETTO ELETTRICO'}
                  </text>
                </g>

                <text x={276} y={10} fontSize={7.5} fill="#64748b" fontWeight="600">FORMATO:</text>
                <g clipPath="url(#modalFormatClip)">
                  <text x={276} y={20} fontSize={9.5} fontWeight="bold" fill="#0f172a">
                    {format} ({orientation === 'landscape' ? 'Orizz.' : 'Vert.'})
                  </text>
                </g>

                <text x={366} y={10} fontSize={7.5} fill="#64748b" fontWeight="600">FOGLIO:</text>
                <g clipPath="url(#modalSheetNoClip)">
                  <text x={366} y={20} fontSize={10} fontWeight="bold" fill="#0f172a">
                    {sheetNo || '1/1'}
                  </text>
                </g>

                {/* Row 2 Content: Full Width Title */}
                <text x={8} y={33} fontSize={7.5} fill="#64748b" fontWeight="600">TITOLO DELLO SCHEMA:</text>
                <g clipPath="url(#modalTitleClip)">
                  <text x={8} y={47} fontSize={12} fontWeight="bold" fill="#1e293b">
                    {title || 'SCHEMA FUNZIONALE'}
                  </text>
                </g>

                {/* Row 3 Content */}
                <text x={8} y={62} fontSize={7.5} fill="#64748b" fontWeight="600">DISEGNATORE:</text>
                <g clipPath="url(#modalAuthorClip)">
                  <text x={8} y={75} fontSize={9} fontWeight="bold" fill="#0f172a">{author}</text>
                </g>

                <text x={126} y={62} fontSize={7.5} fill="#64748b" fontWeight="600">DATA:</text>
                <g clipPath="url(#modalDateClip)">
                  <text x={126} y={75} fontSize={9} fontWeight="bold" fill="#0f172a">{date}</text>
                </g>

                <text x={216} y={62} fontSize={7.5} fill="#64748b" fontWeight="600">REVISIONE:</text>
                <g clipPath="url(#modalRevisionClip)">
                  <text x={216} y={75} fontSize={9} fontWeight="bold" fill="#0f172a">{revision}</text>
                </g>

                <text x={301} y={62} fontSize={7.5} fill="#64748b" fontWeight="600">STANDARD:</text>
                <g clipPath="url(#modalStandardClip)">
                  <text x={301} y={75} fontSize={8.5} fontWeight="bold" fill="#0f172a">
                    {standard || 'CEI / IEC 60617'}
                  </text>
                </g>
              </svg>
            </div>
          </div>

          {/* 1. Titolo dello Schema (Row 2 in TitleBlock) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={15} color="#38bdf8" />
                Titolo dello Schema (Larghezza max 420 px)
              </label>
              {renderBadge(title, CARTIGLIO_LIMITS.title)}
            </div>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              maxLength={CARTIGLIO_LIMITS.title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="es. Avviamento Diretto Marcia/Arresto con Autoritenuta"
              style={inputStyle}
            />
          </div>

          {/* 2. Impianto / Progetto (Row 1 left, width 270px) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Folder size={15} color="#a78bfa" />
                Impianto / Progetto (Larghezza max 270 px)
              </label>
              {renderBadge(project, CARTIGLIO_LIMITS.project)}
            </div>
            <input
              type="text"
              value={project}
              maxLength={CARTIGLIO_LIMITS.project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="es. Impianto Industriale Linea 1"
              style={inputStyle}
            />
          </div>

          {/* 3. Disegnatore & Data (Two columns) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={15} color="#34d399" />
                  Disegnatore (max 120 px)
                </label>
                {renderBadge(author, CARTIGLIO_LIMITS.author)}
              </div>
              <input
                type="text"
                value={author}
                maxLength={CARTIGLIO_LIMITS.author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="es. Ing. Di Filippo"
                style={inputStyle}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={15} color="#f59e0b" />
                  Data (max 90 px)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    onClick={handleSetToday}
                    title="Imposta data odierna"
                    style={{
                      backgroundColor: '#334155',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: 11,
                      padding: '2px 6px',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    Oggi
                  </button>
                  {renderBadge(date, CARTIGLIO_LIMITS.date)}
                </div>
              </div>
              <input
                type="text"
                value={date}
                maxLength={CARTIGLIO_LIMITS.date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="es. 2026-10-18"
                style={inputStyle}
              />
            </div>
          </div>

          {/* 4. Revisione & Foglio (Two columns) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Hash size={15} color="#f472b6" />
                  Revisione (max 85 px)
                </label>
                {renderBadge(revision, CARTIGLIO_LIMITS.revision)}
              </div>
              <input
                type="text"
                value={revision}
                maxLength={CARTIGLIO_LIMITS.revision}
                onChange={(e) => setRevision(e.target.value)}
                placeholder="es. Rev. 1.0"
                style={inputStyle}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Layers size={15} color="#60a5fa" />
                  Foglio (max 60 px)
                </label>
                {renderBadge(sheetNo, CARTIGLIO_LIMITS.sheetNo)}
              </div>
              <input
                type="text"
                value={sheetNo}
                maxLength={CARTIGLIO_LIMITS.sheetNo}
                onChange={(e) => setSheetNo(e.target.value)}
                placeholder="es. 1/1"
                style={inputStyle}
              />
            </div>
          </div>

          {/* 5. Standard Tecnico & Formato Foglio */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={15} color="#22c55e" />
                  Standard (max 125 px)
                </label>
                {renderBadge(standard, CARTIGLIO_LIMITS.standard)}
              </div>
              <input
                type="text"
                value={standard}
                maxLength={CARTIGLIO_LIMITS.standard}
                onChange={(e) => setStandard(e.target.value)}
                placeholder="CEI / IEC 60617"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>
                Formato &amp; Orientamento
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as SheetFormat)}
                  style={{ ...inputStyle, padding: '7px 8px', flex: 1 }}
                >
                  <option value="A4">A4</option>
                  <option value="A3">A3 (Standard)</option>
                  <option value="A2">A2</option>
                  <option value="A1">A1</option>
                </select>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as 'landscape' | 'portrait')}
                  style={{ ...inputStyle, padding: '7px 8px', flex: 1 }}
                >
                  <option value="landscape">Orizzontale</option>
                  <option value="portrait">Verticale</option>
                </select>
              </div>
            </div>
          </div>
        </form>

        {/* Footer actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            padding: '14px 20px',
            borderTop: '1px solid #334155',
            backgroundColor: '#0f172a',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#334155',
              border: 'none',
              color: '#cbd5e1',
              padding: '8px 16px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            style={{
              backgroundColor: '#2563eb',
              border: 'none',
              color: '#ffffff',
              padding: '8px 20px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
            }}
          >
            <Check size={16} /> Salva Cartiglio
          </button>
        </div>
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 6,
  padding: '8px 12px',
  color: '#f8fafc',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s ease',
};

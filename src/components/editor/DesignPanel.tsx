import React from 'react';
import { Palette, Sliders, Image, ChevronDown, ChevronUp } from 'lucide-react';
import { useQRStore } from '../../store';
import { Input } from '../ui/Input';
import { Card, Divider } from '../ui/index';
import type { DotType, CornerSquareType, CornerDotType, ErrorCorrectionLevel } from '../../types';

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}

function SelectField<T extends string>({ label, value, options, onChange }: SelectFieldProps<T>) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm h-9 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 rounded-lg border border-zinc-300 dark:border-zinc-600 cursor-pointer p-0.5 bg-white dark:bg-zinc-800"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-9 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm px-3 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
          maxLength={7}
        />
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, expanded, onToggle }: { icon: React.ElementType; title: string; expanded: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full text-sm font-semibold text-zinc-700 dark:text-zinc-200"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-indigo-500" />
        {title}
      </div>
      {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </button>
  );
}

export function DesignPanel() {
  const { currentDesign, setDesign } = useQRStore();
  const [openSections, setOpenSections] = React.useState({ colors: true, style: true, logo: false });

  const toggle = (s: keyof typeof openSections) =>
    setOpenSections((p) => ({ ...p, [s]: !p[s] }));

  const dotOptions: Array<{ value: DotType; label: string }> = [
    { value: 'square', label: 'Vuông' },
    { value: 'dots', label: 'Chấm tròn' },
    { value: 'rounded', label: 'Góc tròn' },
    { value: 'extra-rounded', label: 'Rất tròn' },
    { value: 'classy', label: 'Classy' },
    { value: 'classy-rounded', label: 'Classy Rounded' },
  ];

  const cornerSquareOptions: Array<{ value: CornerSquareType; label: string }> = [
    { value: 'square', label: 'Vuông' },
    { value: 'dot', label: 'Tròn' },
    { value: 'extra-rounded', label: 'Rất tròn' },
  ];

  const cornerDotOptions: Array<{ value: CornerDotType; label: string }> = [
    { value: 'square', label: 'Vuông' },
    { value: 'dot', label: 'Tròn' },
  ];

  const ecOptions: Array<{ value: ErrorCorrectionLevel; label: string }> = [
    { value: 'L', label: 'L – Thấp (7%)' },
    { value: 'M', label: 'M – Trung bình (15%)' },
    { value: 'Q', label: 'Q – Cao (25%)' },
    { value: 'H', label: 'H – Rất cao (30%) – khuyến nghị' },
  ];

  const sizeOptions = [
    { value: 256, label: '256 px' },
    { value: 512, label: '512 px' },
    { value: 1024, label: '1024 px' },
    { value: 2048, label: '2048 px' },
    { value: 4096, label: '4096 px' },
  ];

  return (
    <Card className="p-4 space-y-4">
      <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
        <Sliders className="h-4 w-4 text-indigo-500" />
        Tùy chỉnh thiết kế
      </div>

      {/* Colors */}
      <div className="space-y-3">
        <SectionHeader icon={Palette} title="Màu sắc" expanded={openSections.colors} onToggle={() => toggle('colors')} />
        {openSections.colors && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <ColorPicker
              label="Màu QR"
              value={currentDesign.foregroundColor}
              onChange={(v) => setDesign({ foregroundColor: v })}
            />
            <ColorPicker
              label="Màu nền"
              value={currentDesign.backgroundColor}
              onChange={(v) => setDesign({ backgroundColor: v })}
            />
          </div>
        )}
      </div>

      <Divider />

      {/* Style */}
      <div className="space-y-3">
        <SectionHeader icon={Sliders} title="Kiểu dáng" expanded={openSections.style} onToggle={() => toggle('style')} />
        {openSections.style && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <SelectField label="Kiểu chấm" value={currentDesign.dotType} options={dotOptions} onChange={(v) => setDesign({ dotType: v })} />
            <SelectField label="Góc ngoài" value={currentDesign.cornerSquareType} options={cornerSquareOptions} onChange={(v) => setDesign({ cornerSquareType: v })} />
            <SelectField label="Góc trong" value={currentDesign.cornerDotType} options={cornerDotOptions} onChange={(v) => setDesign({ cornerDotType: v })} />
            <SelectField label="Sửa lỗi" value={currentDesign.errorCorrection} options={ecOptions} onChange={(v) => setDesign({ errorCorrection: v })} />
            <SelectField
              label="Kích thước xuất"
              value={String(currentDesign.size) as any}
              options={sizeOptions.map((o) => ({ value: String(o.value) as any, label: o.label }))}
              onChange={(v) => setDesign({ size: Number(v) })}
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Viền (margin)</label>
              <input
                type="range" min={0} max={40} step={2}
                value={currentDesign.margin}
                onChange={(e) => setDesign({ margin: Number(e.target.value) })}
                className="accent-indigo-600 h-9 cursor-pointer"
              />
              <span className="text-xs text-zinc-400 text-right">{currentDesign.margin}px</span>
            </div>
          </div>
        )}
      </div>

      <Divider />

      {/* Logo */}
      <div className="space-y-3">
        <SectionHeader icon={Image} title="Logo giữa QR" expanded={openSections.logo} onToggle={() => toggle('logo')} />
        {openSections.logo && (
          <div className="space-y-3 pt-1">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">URL logo (hình ảnh)</label>
              <input
                type="text"
                placeholder="https://example.com/logo.png"
                value={currentDesign.logoUrl ?? ''}
                onChange={(e) => setDesign({ logoUrl: e.target.value || undefined })}
                className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm h-9 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {currentDesign.logoUrl && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Kích thước logo ({currentDesign.logoSize ?? 30}%)</label>
                  <input type="range" min={10} max={50} value={currentDesign.logoSize ?? 30} onChange={(e) => setDesign({ logoSize: Number(e.target.value) })} className="accent-indigo-600 cursor-pointer" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Khoảng cách ({currentDesign.logoMargin ?? 4}px)</label>
                  <input type="range" min={0} max={16} value={currentDesign.logoMargin ?? 4} onChange={(e) => setDesign({ logoMargin: Number(e.target.value) })} className="accent-indigo-600 cursor-pointer" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

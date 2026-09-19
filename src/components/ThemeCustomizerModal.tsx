import React, { useState } from 'react';
import {
  X,
  Palette,
  Sliders,
  Check,
  Sparkles,
  DollarSign,
  Shield,
  Layers,
} from 'lucide-react';
import { StoreConfig, CurrencyCode } from '../types';
import { CLIENT_PRESETS, ClientPreset } from '../store.config';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: StoreConfig;
  onUpdateConfig: (newConfig: StoreConfig) => void;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  const handleSelectPreset = (presetKey: keyof typeof CLIENT_PRESETS) => {
    const preset = CLIENT_PRESETS[presetKey];
    onUpdateConfig({
      ...config,
      storeName: preset.storeName,
      tagline: preset.tagline,
      brandColor: preset.brandColor,
      accentColor: preset.accentColor,
      fontHeading: preset.fontHeading,
      fontBody: preset.fontBody,
      announcementBanner: preset.announcementBanner,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 bg-neutral-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: config.brandColor }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg text-neutral-900">
                White-Label Client Reskinning Engine
              </h2>
              <p className="text-xs text-neutral-500">
                Instantly switch themes, currencies, branding, and export your config.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-neutral-200 px-6 bg-white">
          <button
            onClick={() => setActiveTab('presets')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 ${
              activeTab === 'presets'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Ready-to-Sell Client Presets</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 ${
              activeTab === 'custom'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Granular Controls</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-500">
                Click any niche below to instantly transform StoreForge's branding, palette, and typography for different client gigs:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {(Object.entries(CLIENT_PRESETS) as [string, ClientPreset][]).map(([key, preset]) => {
                  const isSelected = config.storeName === preset.storeName;
                  return (
                    <div
                      key={key}
                      onClick={() => handleSelectPreset(key as any)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-neutral-900 bg-neutral-50/80 shadow-md ring-1 ring-neutral-900'
                          : 'border-neutral-200 hover:border-neutral-400 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full shadow-sm"
                            style={{ backgroundColor: preset.brandColor }}
                          />
                          <span className="font-display font-bold text-sm text-neutral-900">
                            {preset.storeName}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-neutral-900 bg-white border border-neutral-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" /> Active
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-neutral-600 font-medium">{preset.tagline}</p>

                      <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
                        <span>Palette: {preset.brandColor}</span>
                        <span>Font: {preset.fontHeading}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: GRANULAR CONTROLS */}
          {activeTab === 'custom' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Store Brand Name</label>
                  <input
                    type="text"
                    value={config.storeName}
                    onChange={(e) => onUpdateConfig({ ...config, storeName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-neutral-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={config.tagline}
                    onChange={(e) => onUpdateConfig({ ...config, tagline: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-neutral-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Brand Hex Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={config.brandColor}
                      onChange={(e) => onUpdateConfig({ ...config, brandColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border p-0.5"
                    />
                    <input
                      type="text"
                      value={config.brandColor}
                      onChange={(e) => onUpdateConfig({ ...config, brandColor: e.target.value })}
                      className="flex-1 p-2.5 rounded-xl border border-neutral-300 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Default Currency</label>
                  <select
                    value={config.currency}
                    onChange={(e) => onUpdateConfig({ ...config, currency: e.target.value as CurrencyCode })}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white"
                  >
                    <option value="USD">USD ($) — United States</option>
                    <option value="EUR">EUR (€) — European Union</option>
                    <option value="GBP">GBP (£) — United Kingdom</option>
                    <option value="INR">INR (₹) — India (Razorpay)</option>
                    <option value="CAD">CAD ($) — Canada</option>
                    <option value="AUD">AUD ($) — Australia</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={config.taxRatePercent}
                    onChange={(e) => onUpdateConfig({ ...config, taxRatePercent: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-neutral-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Free Shipping Threshold ($)</label>
                  <input
                    type="number"
                    value={config.freeShippingThreshold}
                    onChange={(e) => onUpdateConfig({ ...config, freeShippingThreshold: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-neutral-300"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-neutral-700 mb-1">Top Announcement Banner</label>
                  <input
                    type="text"
                    value={config.announcementBanner}
                    onChange={(e) => onUpdateConfig({ ...config, announcementBanner: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-neutral-300"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

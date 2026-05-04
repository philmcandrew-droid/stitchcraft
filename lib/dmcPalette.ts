import { hexToRgb, rgbToLab } from '@/lib/colorLab';
import type { ThreadSwatch } from '@/lib/types';

/** Curated DMC-style swatches for MVP designer (hex approximations). */
export const MASTER_PALETTE: ThreadSwatch[] = [
  { dmc: '310', hex: '#1B1B1B', name: 'Black' },
  { dmc: 'Blanc', hex: '#F2F0E8', name: 'White' },
  { dmc: '321', hex: '#C41E3A', name: 'Christmas Red' },
  { dmc: '498', hex: '#8B1538', name: 'Dark Red' },
  { dmc: '666', hex: '#E40000', name: 'Bright Red' },
  { dmc: '700', hex: '#046A38', name: 'Christmas Green' },
  { dmc: '701', hex: '#3F8F4B', name: 'Green' },
  { dmc: '703', hex: '#8FD19A', name: 'Chartreuse' },
  { dmc: '738', hex: '#E8C89A', name: 'Tan' },
  { dmc: '743', hex: '#F2C14E', name: 'Yellow' },
  { dmc: '796', hex: '#003B7A', name: 'Royal Blue' },
  { dmc: '809', hex: '#5BC0DE', name: 'Delft Blue' },
  { dmc: '820', hex: '#0F4C81', name: 'Navy' },
  { dmc: '900', hex: '#3D1A0F', name: 'Burnt Sienna' },
  { dmc: '938', hex: '#6B3A2E', name: 'Coffee Brown' },
  { dmc: '3371', hex: '#1E1A18', name: 'Black Brown' },
  { dmc: '3799', hex: '#6B6B7A', name: 'Pewter Grey' },
  { dmc: '4150', hex: '#B8B8C6', name: 'Pearl Grey' },
  { dmc: '208', hex: '#7B4B9A', name: 'Lavender' },
  { dmc: '550', hex: '#6E3A99', name: 'Violet' },
  { dmc: '603', hex: '#F5A6D3', name: 'Pink' },
  { dmc: '605', hex: '#E91E8C', name: 'Cranberry' },
  { dmc: '740', hex: '#F47F1A', name: 'Tangerine' },
  { dmc: '972', hex: '#FFB300', name: 'Deep Canary' },
];

export const MASTER_PALETTE_LAB = MASTER_PALETTE.map((t) => ({
  ...t,
  lab: rgbToLab(hexToRgb(t.hex)) as [number, number, number],
}));
